import { storage, db } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, getDoc, setDoc } from "firebase/firestore";

// 파일 해시 계산 함수 (SHA-256)
const calculateFileHash = async (file) => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// 이미지 중복 체크 및 URL 반환
const checkImageDuplicate = async (fileHash, pathPrefix) => {
  try {
    const hashDocRef = doc(db, 'imageHashes', fileHash);
    const hashDoc = await getDoc(hashDocRef);
    
    if (hashDoc.exists()) {
      const data = hashDoc.data();
      // 같은 pathPrefix를 가진 이미지가 있는지 확인
      if (data[pathPrefix]) {
        console.log('중복 이미지 발견, 기존 URL 사용:', data[pathPrefix]);
        return data[pathPrefix];
      }
    }
    return null;
  } catch (error) {
    console.error('이미지 중복 체크 실패:', error);
    return null;
  }
};

// 이미지 해시와 URL을 Firestore에 저장
const saveImageHash = async (fileHash, pathPrefix, imageUrl) => {
  try {
    const hashDocRef = doc(db, 'imageHashes', fileHash);
    const hashDoc = await getDoc(hashDocRef);
    
    const updateData = {
      [pathPrefix]: imageUrl,
      updatedAt: new Date()
    };
    
    if (hashDoc.exists()) {
      // 기존 해시 문서에 새로운 pathPrefix 추가
      const existingData = hashDoc.data();
      await setDoc(hashDocRef, {
        ...existingData,
        ...updateData
      }, { merge: true });
    } else {
      // 새로운 해시 문서 생성
      await setDoc(hashDocRef, {
        ...updateData,
        createdAt: new Date()
      });
    }
    
    console.log('이미지 해시 저장 완료:', fileHash, pathPrefix);
  } catch (error) {
    console.error('이미지 해시 저장 실패:', error);
  }
};

// Firebase Storage로 업로드하되, 옵션에 따라 리사이즈/압축 수행
// 사용법:
// handleImageUpload(file, { pathPrefix: 'sliders/UID', compress: true, targetMaxKB: 600 }, (url) => { ... })
// 콜백만 두 번째 인자로 주면, 기본옵션(compress: true, pathPrefix: 'uploads')로 동작
export const handleImageUpload = async (file, optionsOrCb, maybeCb) => {
  if (!file) return;

  // 시그니처 정규화
  const hasOptions = typeof optionsOrCb === 'object' && optionsOrCb !== null;
  const options = hasOptions ? optionsOrCb : {};
  const callback = hasOptions ? maybeCb : optionsOrCb;

  if (typeof callback !== 'function') {
    console.error('handleImageUpload: callback 이 필요합니다.');
    return;
  }

  // 기본 옵션
  const {
    pathPrefix = 'uploads',
    compress = true,
    targetMaxKB = 600, // 슬라이더용 기본 타깃 용량
    maxWidth = 2000,
    maxHeight = 2000,
    jpegQuality = 0.82
  } = options;

  // 타입 검증
  if (!file.type.startsWith('image/')) {
    alert('이미지 파일만 업로드 가능합니다.');
    return;
  }

  // 이미지 로드 후 필요시 리사이즈 → Blob 생성
  const getProcessBlob = () => new Promise((resolve, reject) => {
    if (!compress) {
      resolve(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const widthRatio = maxWidth / width;
          const heightRatio = maxHeight / height;
          const ratio = Math.min(widthRatio, heightRatio);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // JPEG로 저장(용량 절감). PNG 필요성이 큰 경우에만 PNG 유지하도록 확장 가능.
        const toBlobWithQuality = (quality) => new Promise((res) => {
          canvas.toBlob((b) => res(b), 'image/jpeg', quality);
        });

        const tryQualities = [jpegQuality, 0.76, 0.7, 0.6, 0.5];
        (async () => {
          let out = await toBlobWithQuality(tryQualities[0]);
          for (let i = 1; i < tryQualities.length; i++) {
            if (out && out.size <= targetMaxKB * 1024) break;
            out = await toBlobWithQuality(tryQualities[i]);
          }
          resolve(out || file);
        })();
      };
      img.onerror = () => reject(new Error('이미지를 불러올 수 없습니다.'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
    reader.readAsDataURL(file);
  });

  try {
    // 1. 원본 파일의 해시값 계산
    const fileHash = await calculateFileHash(file);
    console.log('파일 해시 계산 완료:', fileHash);
    
    // 2. 중복 이미지 체크
    const safePrefix = pathPrefix.replace(/\/+$/, '');
    const existingUrl = await checkImageDuplicate(fileHash, safePrefix);
    
    if (existingUrl) {
      console.log('중복 이미지 발견, 기존 URL 사용');
      callback(existingUrl);
      return;
    }
    
    // 3. 이미지 처리 및 업로드
    const blob = await getProcessBlob();
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${safePrefix}/${Date.now()}_${Math.random().toString(36).slice(2)}.${compress ? 'jpg' : ext}`;
    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, blob, { contentType: compress ? 'image/jpeg' : file.type });
    const url = await getDownloadURL(fileRef);
    
    // 4. 해시와 URL을 Firestore에 저장
    await saveImageHash(fileHash, safePrefix, url);
    
    console.log('새 이미지 업로드 완료:', url);
    callback(url);
  } catch (err) {
    console.error('이미지 업로드 실패:', err);
    alert(`이미지 업로드에 실패했습니다. ${err?.message || ''}`);
  }
};

// 이미지 미리보기 컴포넌트를 위한 유틸리티
export const ImagePreview = ({ src, alt = "미리보기", style = {} }) => {
  if (!src) return null;
  
  return (
    <img
      src={src}
      alt={alt}
      style={{
        maxWidth: '200px',
        maxHeight: '200px',
        objectFit: 'cover',
        borderRadius: '4px',
        border: '1px solid #ddd',
        ...style
      }}
    />
  );
};
