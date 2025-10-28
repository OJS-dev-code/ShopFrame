// src/utils/storageManager.js
import { db } from "../firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, setDoc } from "firebase/firestore";

class StorageManager {
  constructor() {
    this.storageTypes = {
      firebase: 'Firebase Firestore',
      local: 'Local Storage (브라우저)',
      json: 'JSON 파일',
      memory: '메모리 (임시)'
    };
  }

  // 저장소 설정 가져오기
  getStorageConfig() {
    const config = localStorage.getItem('storageConfig');
    return config ? JSON.parse(config) : { 
      primary: 'firebase', 
      backup: 'local',
      autoBackup: true 
    };
  }

  // 저장소 설정 저장
  setStorageConfig(config) {
    localStorage.setItem('storageConfig', JSON.stringify(config));
  }

  // 상품 저장 (다중 저장소)
  async saveProduct(product, storageTypes = ['firebase']) {
    const results = [];
    
    for (const storageType of storageTypes) {
      try {
        let result;
        switch (storageType) {
          case 'firebase':
            result = await this.saveToFirebase(product);
            break;
          case 'local':
            result = await this.saveToLocal(product);
            break;
          case 'json':
            result = await this.saveToJSON(product);
            break;
          case 'memory':
            result = await this.saveToMemory(product);
            break;
        }
        results.push({ storage: storageType, success: true, result });
      } catch (error) {
        results.push({ storage: storageType, success: false, error: error.message });
      }
    }
    
    return results;
  }

  // 상품 업데이트 (다중 저장소)
  async updateProduct(productId, updates, storageTypes = ['firebase']) {
    const results = [];
    
    for (const storageType of storageTypes) {
      try {
        let result;
        switch (storageType) {
          case 'firebase':
            result = await this.updateInFirebase(productId, updates);
            break;
          case 'local':
            result = await this.updateInLocal(productId, updates);
            break;
          case 'json':
            result = await this.updateInJSON(productId, updates);
            break;
          case 'memory':
            result = await this.updateInMemory(productId, updates);
            break;
        }
        results.push({ storage: storageType, success: true, result });
      } catch (error) {
        results.push({ storage: storageType, success: false, error: error.message });
      }
    }
    
    return results;
  }

  // 상품 삭제 (다중 저장소)
  async deleteProduct(productId, storageTypes = ['firebase']) {
    const results = [];
    
    for (const storageType of storageTypes) {
      try {
        let result;
        switch (storageType) {
          case 'firebase':
            result = await this.deleteFromFirebase(productId);
            break;
          case 'local':
            result = await this.deleteFromLocal(productId);
            break;
          case 'json':
            result = await this.deleteFromJSON(productId);
            break;
          case 'memory':
            result = await this.deleteFromMemory(productId);
            break;
        }
        results.push({ storage: storageType, success: true, result });
      } catch (error) {
        results.push({ storage: storageType, success: false, error: error.message });
      }
    }
    
    return results;
  }

  // Firebase 저장
  async saveToFirebase(product) {
    const docRef = await addDoc(collection(db, "products"), {
      ...product,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return { id: docRef.id, ...product };
  }

  async updateInFirebase(productId, updates) {
    const productRef = doc(db, "products", productId);
    await updateDoc(productRef, {
      ...updates,
      updatedAt: new Date()
    });
    return { id: productId, ...updates };
  }

  async deleteFromFirebase(productId) {
    await deleteDoc(doc(db, "products", productId));
    return { id: productId, deleted: true };
  }

  // Local Storage 저장
  async saveToLocal(product) {
    const products = this.getLocalProducts();
    const newProduct = { 
      id: product.id || Date.now().toString(), 
      ...product,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    products.push(newProduct);
    localStorage.setItem('products', JSON.stringify(products));
    return newProduct;
  }

  async updateInLocal(productId, updates) {
    const products = this.getLocalProducts();
    const index = products.findIndex(p => p.id === productId);
    if (index !== -1) {
      products[index] = { 
        ...products[index], 
        ...updates,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('products', JSON.stringify(products));
      return products[index];
    }
    throw new Error('Product not found');
  }

  async deleteFromLocal(productId) {
    const products = this.getLocalProducts();
    const filtered = products.filter(p => p.id !== productId);
    localStorage.setItem('products', JSON.stringify(filtered));
    return { id: productId, deleted: true };
  }

  getLocalProducts() {
    const stored = localStorage.getItem('products');
    return stored ? JSON.parse(stored) : [];
  }

  // JSON 파일 저장 (다운로드)
  async saveToJSON(product) {
    const products = this.getLocalProducts();
    const newProduct = { 
      id: product.id || Date.now().toString(), 
      ...product,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    products.push(newProduct);
    
    // JSON 파일로 다운로드
    const dataStr = JSON.stringify(products, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `products_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    return newProduct;
  }

  async updateInJSON(productId, updates) {
    // JSON 업데이트는 로컬 스토리지와 동일하게 처리
    return await this.updateInLocal(productId, updates);
  }

  async deleteFromJSON(productId) {
    // JSON 삭제는 로컬 스토리지와 동일하게 처리
    return await this.deleteFromLocal(productId);
  }

  // 메모리 저장 (임시)
  async saveToMemory(product) {
    if (!window.memoryStorage) {
      window.memoryStorage = { products: [] };
    }
    const newProduct = { 
      id: product.id || Date.now().toString(), 
      ...product,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    window.memoryStorage.products.push(newProduct);
    return newProduct;
  }

  async updateInMemory(productId, updates) {
    if (!window.memoryStorage) return;
    const index = window.memoryStorage.products.findIndex(p => p.id === productId);
    if (index !== -1) {
      window.memoryStorage.products[index] = { 
        ...window.memoryStorage.products[index], 
        ...updates,
        updatedAt: new Date().toISOString()
      };
      return window.memoryStorage.products[index];
    }
    throw new Error('Product not found');
  }

  async deleteFromMemory(productId) {
    if (!window.memoryStorage) return;
    window.memoryStorage.products = window.memoryStorage.products.filter(p => p.id !== productId);
    return { id: productId, deleted: true };
  }

  // 모든 저장소에서 데이터 로드
  async loadFromAllStorages() {
    const results = {};
    
    try {
      // Firebase에서 로드
      const firebaseSnapshot = await getDocs(collection(db, "products"));
      results.firebase = firebaseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      results.firebase = { error: error.message };
    }

    try {
      // Local Storage에서 로드
      results.local = this.getLocalProducts();
    } catch (error) {
      results.local = { error: error.message };
    }

    try {
      // Memory에서 로드
      results.memory = window.memoryStorage?.products || [];
    } catch (error) {
      results.memory = { error: error.message };
    }

    return results;
  }

  // JSON 파일에서 데이터 가져오기
  async importFromJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          resolve(data);
        } catch (error) {
          reject(new Error('Invalid JSON file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  // 데이터 동기화
  async syncData() {
    const allData = await this.loadFromAllStorages();
    const config = this.getStorageConfig();
    
    // 기본 저장소의 데이터를 다른 저장소들과 동기화
    const primaryData = allData[config.primary];
    if (Array.isArray(primaryData)) {
      for (const storageType of Object.keys(this.storageTypes)) {
        if (storageType !== config.primary) {
          try {
            // 각 저장소에 데이터 동기화
            if (storageType === 'local') {
              localStorage.setItem('products', JSON.stringify(primaryData));
            } else if (storageType === 'memory') {
              window.memoryStorage = { products: primaryData };
            }
          } catch (error) {
            console.error(`Failed to sync to ${storageType}:`, error);
          }
        }
      }
    }
    
    return allData;
  }
}

export default new StorageManager();
