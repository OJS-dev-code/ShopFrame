// Firebase 설정
export const firebaseConfig = {
  apiKey: "AIzaSyAD-o6ZZfngIByoW3ueK4XBAmrRRkzqnLs",
  authDomain: "hotel-83914.firebaseapp.com",
  databaseURL: "https://hotel-83914-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "hotel-83914",
  storageBucket: "hotel-83914.firebasestorage.app",
  messagingSenderId: "882271689608",
  appId: "1:882271689608:web:8ceb3166e13b5a0438783d",
  measurementId: "G-C3Z9VW9GG4"
};

// Firebase 서비스 설정
export const firebaseServices = {
  // 인증 설정
  auth: {
    // 지원하는 로그인 방법
    signInMethods: ['email', 'google', 'kakao'],
    
    // 이메일/비밀번호 설정
    emailPassword: {
      enabled: true,
      requireEmailVerification: false
    },
    
    // Google 로그인 설정
    google: {
      enabled: true,
      scopes: ['profile', 'email']
    },
    
    // 카카오 로그인 설정
    kakao: {
      enabled: true,
      customToken: true
    }
  },
  
  // Firestore 설정
  firestore: {
    // 데이터베이스 규칙
    rules: {
      // 사용자 데이터 접근 규칙
      users: {
        read: 'auth != null',
        write: 'auth != null && auth.uid == resource.id'
      },
      
      // 사이트 데이터 접근 규칙
      sites: {
        read: 'auth != null',
        write: 'auth != null'
      }
    }
  },
  
  // Storage 설정
  storage: {
    // 업로드 가능한 파일 타입
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    
    // 최대 파일 크기 (MB)
    maxFileSize: 10,
    
    // 이미지 압축 설정
    imageCompression: {
      enabled: true,
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1080
    }
  }
};
