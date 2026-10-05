export const savedReadingsKey='pickacard:saved-readings:v1';
const limit=10;

export function loadSavedReadings(storage){
 try{
  const value=JSON.parse(storage?.getItem(savedReadingsKey)||'[]');
  return Array.isArray(value)?value.filter(item=>item&&typeof item.id==='string'&&typeof item.slug==='string'&&Array.isArray(item.cards)).slice(0,limit):[];
 }catch{return [];}
}

export function saveReadingRecord(storage,record){
 if(!storage||!record?.id||!record?.slug||!Array.isArray(record.cards))return false;
 try{
  const current=loadSavedReadings(storage).filter(item=>item.id!==record.id);
  storage.setItem(savedReadingsKey,JSON.stringify([record,...current].slice(0,limit)));
  return true;
 }catch{return false;}
}

export function removeSavedReading(storage,id){
 if(!storage||!id)return false;
 try{
  storage.setItem(savedReadingsKey,JSON.stringify(loadSavedReadings(storage).filter(item=>item.id!==id)));
  return true;
 }catch{return false;}
}

export function clearSavedReadings(storage){
 if(!storage)return false;
 try{storage.removeItem(savedReadingsKey);return true;}catch{return false;}
}
