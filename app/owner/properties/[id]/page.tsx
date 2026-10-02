'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {mockProperties} from '@/lib/mock-data/properties';
import type {Property} from '@/lib/mock-data/types';
import {setStorageItem,getStorageItem} from '@/lib/storage';

export default function ManageProperty({params}:{params:{id:string}}){
 const [property,setProperty]=useState<Property>();
 const [data,setData]=useState<any>({});
 useEffect(()=>{
  setProperty([...mockProperties,...getStorageItem<Property[]>('roomsaathi_owner_created',[])].find(x=>x.id===params.id));
  setData(getStorageItem<Record<string,any>>('roomsaathi_owner_changes',{})[params.id]||{});
 },[params.id]);
 if(!property)return <div className="container section"><h2>Property <em className="title-accent">not found</em></h2><Link href="/owner/properties">Back</Link></div>;
 function save(next:any){setData(next);setStorageItem('roomsaathi_owner_changes',{...getStorageItem('roomsaathi_owner_changes',{}),[property!.id]:next})}
 return <div className="container section" style={{maxWidth:850}}><div className="eyebrow">मालिक का dashboard · listing संभालें</div><h2 style={{marginTop:8}}>{property.name.split(" " ).slice(0,-1).join(" " )} <em className="title-accent">{property.name.split(" " ).slice(-1)}</em></h2><p className="muted">{property.area} · {property.totalBeds} total beds</p><div className="stats"><div className="stat"><span className="muted">Beds available</span><strong>{data.available??property.availableBeds}</strong></div><div className="stat"><span className="muted">Monthly rent</span><strong>₹{data.rent??property.rent}</strong></div><div className="stat"><span className="muted">Occupancy</span><strong>85%</strong></div><div className="stat"><span className="muted">Listing status</span><strong>{data.paused?'Paused':'Active'}</strong></div></div><div className="panel"><h3>Quick <em className="title-accent">actions</em></h3><div className="sidebar-links"><button className="btn outline small" onClick={()=>save({...data,available:Math.max(0,(data.available??property.availableBeds)-1)})}>Mark bed occupied</button><button className="btn outline small" onClick={()=>save({...data,available:(data.available??property.availableBeds)+1})}>Mark bed available</button><button className="btn outline small" onClick={()=>save({...data,available:(data.available??property.availableBeds)+1})}>Reserve bed</button><button className="btn outline small" onClick={()=>save({...data,paused:!data.paused})}>{data.paused?'Resume listing':'Pause listing'}</button></div><div className="field" style={{maxWidth:270}}><label>Update monthly rent</label><input className="input" type="number" value={data.rent??property.rent} onChange={e=>save({...data,rent:Number(e.target.value)})}/></div><div className="field" style={{maxWidth:380,marginTop:14}}><label>Upload a demo photo</label><input className="input" type="file" accept="image/*" onChange={e=>save({...data,imageName:e.target.files?.[0]?.name??''})}/><small className="muted">{data.imageName||'Image selection is not uploaded or stored.'}</small></div><button className="btn outline small" style={{marginTop:14}} onClick={()=>save({...data,editing:!data.editing})}>{data.editing?'Done':'Edit listing details'}</button>{data.editing&&<div className="field" style={{marginTop:12}}><label>Listing description</label><textarea className="input" rows={4} defaultValue={data.description??property.description} onChange={e=>save({...data,description:e.target.value})}/></div>}</div><Link href="/owner/properties" className="muted">← All properties</Link></div>
}
