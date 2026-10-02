export function getStorageItem<T>(key:string,fallback:T):T { if(typeof window==='undefined') return fallback; try { const value=localStorage.getItem(key); return value?JSON.parse(value) as T:fallback; } catch { return fallback; } }
export function setStorageItem<T>(key:string,value:T) { if(typeof window!=='undefined') try { localStorage.setItem(key,JSON.stringify(value)); } catch {} }
export function removeStorageItem(key:string) { if(typeof window!=='undefined') localStorage.removeItem(key); }
