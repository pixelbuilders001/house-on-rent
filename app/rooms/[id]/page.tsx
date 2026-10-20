'use client';
import {useEffect,useState} from 'react';import Link from 'next/link';import {useRouter} from 'next/navigation';import {ArrowLeft,CalendarDays,Check,Clock,Heart,MapPin,Phone,ShieldCheck,Star,Utensils,Wifi} from 'lucide-react';import {getPropertyById,getAvailableBeds} from '@/lib/services/propertyService';import type {Property} from '@/lib/mock-data/types';import {mockReviews} from '@/lib/mock-data/reviews';import {getPropertyReviews,type PropertyReview} from '@/lib/services/catalogService';import {calculateMonthlyCost,calculateMoveInCost} from '@/lib/pricing';import {PropertyCard} from '@/components/PropertyCard';import {Modal} from '@/components/Modal';import {getStorageItem,setStorageItem} from '@/lib/storage';
import {getSupabaseBrowserClient} from '@/lib/supabase/client';
export default function Detail({params}:{params:{id:string}}){const [p,setP]=useState<Property>();const [reviews,setReviews]=useState<PropertyReview[]>(mockReviews.map((review,i)=>({id:'demo-'+i,...review})));const [beds,setBeds]=useState<any[]>([]);const [modal,setModal]=useState('');const [message,setMessage]=useState('');const [saved,setSaved]=useState(false);const [chosen,setChosen]=useState<any>();const [related,setRelated]=useState<Property[]>([]);const router=useRouter();useEffect(()=>{getPropertyReviews(params.id).then(setReviews);getPropertyById(params.id).then(async x=>{if(x){setP(x);setBeds(await getAvailableBeds(x.id))}});setSaved(getStorageItem<string[]>('roomsaathi_saved_properties',[]).includes(params.id));},[params.id]);
function finish(text:string,key:string,payload:any){
  setStorageItem(key,[...getStorageItem<any[]>(key,[]),{...payload,propertyId:p?.id,createdAt:new Date().toISOString()}]);
  const supabase = getSupabaseBrowserClient();
  if (supabase && p) {
    const renterName = payload.name || payload.renterName || 'Website Inquiry';
    const renterPhone = payload.phone || payload.renterPhone || '+91 98000 00000';
    const lookingFor = payload.bed?.bed ? `${payload.bed.room} - ${payload.bed.bed}` : p.accommodation;
    supabase.from('leads').insert({
      property_id: p.id,
      renter_name: renterName,
      renter_phone: renterPhone,
      budget: p.rent,
      looking_for: lookingFor,
      destination: p.area || 'Samastipur',
      status: 'new',
      visit_date: payload.date || '',
      visit_time: payload.time || '',
      notes: payload.kind ? `Inquiry via ${payload.kind}` : 'Direct bed/room lead request'
    }).then(({ error }) => {
      if (error) console.error('Failed to sync lead to Supabase', error);
    });
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').update({ role: 'tenant' }).eq('id', user.id).then();
      }
    });
  }
  setMessage(text);
  setModal('success');
}
if(!p)return <div className="container section"><Link href="/search" className="muted"><ArrowLeft size={15}/> Back to search</Link><h2 style={{marginTop:20}}>Room <em className="title-accent">not found</em></h2><Link className="btn" href="/search">Browse rooms</Link></div>;
const hasPhoto = Boolean(p.image && p.image.trim() !== '' && !p.image.includes('roomsaathi-property-gallery.png'));

return (
  <div className="container">
    <div style={{paddingTop:20}}>
      <Link href="/search" className="muted"><ArrowLeft size={15}/> Back to rooms</Link>
    </div>
    <div className="detail-layout">
      <article>
        <div className="gallery">
          {(() => {
            const propImages = (p.images && p.images.length > 0)
              ? p.images
              : (p.image && p.image.trim() !== '' && !p.image.includes('roomsaathi-property-gallery.png') ? [p.image] : []);
            const slot1 = propImages[0];
            const slot2 = propImages[1];
            const slot3 = propImages[2];

            return (
              <>
                {slot1 ? (
                  <div
                    className="property-image has-photo"
                    style={{
                      backgroundImage: `url(${slot1})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    <span className="image-label">Cover photo</span>
                  </div>
                ) : (
                  <div className="property-image" data-tone={Number(p.id.slice(-1))%5}>
                    <span className="image-label">Property photo</span>
                  </div>
                )}

                {slot2 ? (
                  <div
                    className="property-image has-photo"
                    style={{
                      backgroundImage: `url(${slot2})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    <span className="image-label">Room & Interior</span>
                  </div>
                ) : (
                  <div className="property-image" data-tone={(Number(p.id.slice(-1))+1)%5}>
                    <span className="image-label">Shared spaces</span>
                  </div>
                )}

                {slot3 ? (
                  <div
                    className="property-image has-photo"
                    style={{
                      backgroundImage: `url(${slot3})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    <span className="image-label">Washroom & Amenities</span>
                  </div>
                ) : (
                  <div className="property-image" data-tone={(Number(p.id.slice(-1))+2)%5}>
                    <span className="image-label">Rooms</span>
                  </div>
                )}
              </>
            );
          })()}
        </div>

        <div className="detail-head" style={{display:'flex',justifyContent:'space-between',gap:15,marginTop:22}}>
          <div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <h2>{p.name.split(" ").slice(0,-1).join(" ")} <em className="title-accent">{p.name.split(" ").slice(-1)}</em></h2>
              <span className="tag">{p.type}</span>
            </div>
            <p className="muted">
              <MapPin size={14}/> {p.area}, Samastipur {p.pincode ? `(${p.pincode})` : ''} · {p.distanceKm} km · {p.commuteMinutes} min to destination
            </p>
            {(p.stationDistanceKm != null || p.busStandDistanceKm != null) && (
              <div style={{display:'flex',gap:10,margin:'6px 0',flexWrap:'wrap',fontSize:13}}>
                {p.stationDistanceKm != null && (
                  <span style={{background:'#f0fdf4',color:'#166534',padding:'3px 8px',borderRadius:6,border:'1px solid #bbf7d0',fontWeight:600}}>
                    🚉 {p.stationDistanceKm} km from Samastipur Jn Railway Station
                  </span>
                )}
                {p.busStandDistanceKm != null && (
                  <span style={{background:'#eff6ff',color:'#1e40af',padding:'3px 8px',borderRadius:6,border:'1px solid #bfdbfe',fontWeight:600}}>
                    🚌 {p.busStandDistanceKm} km from Govt Bus Stand
                  </span>
                )}
              </div>
            )}
            <p><Star size={15} fill="#e7b74d" color="#e7b74d"/> <b>{p.rating || 4.5}</b> <span className="muted"> · {p.reviewCount || 0} reviews</span></p>
          </div>
          <button className={`btn outline small ${saved?'selected':''}`} onClick={()=>{const arr=getStorageItem<string[]>('roomsaathi_saved_properties',[]);const next=saved?arr.filter(x=>x!==p.id):[...arr,p.id];setStorageItem('roomsaathi_saved_properties',next);setSaved(!saved)}}><Heart size={15} fill={saved?'currentColor':'none'}/>{saved?'Saved':'Save'}</button>
        </div>

        <div className="demo-note"><ShieldCheck size={15}/> यहाँ verification badge सिर्फ़ demo के लिए है। असल में किसी property की जाँच नहीं हुई है। <button className="pill" onClick={()=>setModal('verification')}>What’s this?</button></div>

        <section className="detail-card">
          <h3>Know your monthly <em className="title-accent">cost</em></h3>
          <p className="muted">सिर्फ़ किराया ही नहीं—यहाँ हर महीने के बाकी खर्चों का भी पूरा हिसाब है।</p>
          <div className="breakdown-row"><span>Monthly rent</span><b>₹{p.rent.toLocaleString()}</b></div>
          <div className="breakdown-row"><span>Electricity</span><b>₹{p.electricity.toLocaleString()}</b></div>
          <div className="breakdown-row"><span>Wi-Fi</span><b>₹{p.wifiCost.toLocaleString()}</b></div>
          <div className="breakdown-row"><span>Maintenance</span><b>₹{p.maintenance.toLocaleString()}</b></div>
          <div className="breakdown-row"><span>Food {p.foodIncluded?'(included)':'(if selected)'}</span><b>₹{p.foodCost.toLocaleString()}</b></div>
          <div className="breakdown-row total"><span>Estimated monthly living cost ⓘ</span><b>₹{calculateMonthlyCost(p).toLocaleString()}</b></div>
          <p className="muted">इस अनुमान में ऊपर दिए गए नियमित खर्च शामिल हैं। असली bills थोड़े अलग हो सकते हैं।</p>
          <hr style={{border:0,borderTop:'1px solid #e8ece8',margin:'15px 0'}}/>
          <h3>Move-in <em className="title-accent">cost</em></h3>
          <div className="breakdown-row"><span>First month rent</span><b>₹{p.rent.toLocaleString()}</b></div>
          <div className="breakdown-row"><span>Security deposit</span><b>₹{p.deposit.toLocaleString()}</b></div>
          <div className="breakdown-row"><span>Brokerage</span><b>₹{p.brokerage.toLocaleString()}</b></div>
          <div className="breakdown-row total"><span>Estimated move-in cost</span><b>₹{calculateMoveInCost(p).toLocaleString()}</b></div>
        </section>

        <section className="detail-card">
          <h3>Available <em className="title-accent">beds</em></h3>
          <p className="muted">किसी bed के बारे में जानकारी पाने के लिए चुनें।</p>
          <div className="room-grid">{(beds.length?beds:[{id:'waitlist',room:'Room 101',bed:'Next available bed',status:'Available'}]).slice(0,6).map(b=><div className="room" key={b.id}><b>{b.room}</b><div className="muted" style={{margin:'8px 0'}}>{p.accommodation} · {b.bed}</div><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><span className={`tag ${b.status==='Available'?'':'pending'}`}>{b.status}</span><b>₹{p.rent.toLocaleString()}<small className="muted">/mo</small></b></div><button className="btn outline small" style={{width:'100%',marginTop:12}} disabled={b.status==='Occupied'} onClick={()=>{setChosen(b);setModal('bed')}}>{b.status==='Occupied'?'Occupied':'Request this bed'}</button></div>)}</div>
        </section>

        <section className="detail-card">
          <h3><em className="title-accent">Amenities</em></h3>
          <div className="amenity-row">{p.amenities.map(a=><span className="amenity" key={a}>{a==='Food'?<Utensils size={13}/>:a==='Wi-Fi'?<Wifi size={13}/>:<Check size={13}/>} {a}</span>)}</div>
        </section>

        <section className="detail-card">
          <h3>About this <em className="title-accent">place</em></h3>
          <p style={{lineHeight:1.7,color:'#5d6d65'}}>{p.description}</p>
          <h3 style={{marginTop:22}}>House <em className="title-accent">rules</em></h3>
          {p.rules.map(x=><div className="breakdown-row" key={x}><span>✓ {x}</span></div>)}
        </section>

        <section className="detail-card">
          <h3>Location & <em className="title-accent">Transit</em></h3>
          <div style={{height:180,borderRadius:13,background:'linear-gradient(135deg,#edf3ed,#dce9de)',display:'grid',placeItems:'center',textAlign:'center',color:'#507163'}}>
            <div>
              <MapPin size={24}/>
              <p><b>{p.area}</b><br/><small>Samastipur {p.pincode ? `· PIN ${p.pincode}` : ''}</small></p>
            </div>
          </div>
          <div style={{marginTop:15,display:'flex',flexDirection:'column',gap:8}}>
            {p.stationDistanceKm != null && (
              <p className="muted" style={{margin:0}}>
                <Clock size={14}/> 🚉 Samastipur Jn Railway Station: <b>{p.stationDistanceKm} km</b>
              </p>
            )}
            {p.busStandDistanceKm != null && (
              <p className="muted" style={{margin:0}}>
                <Clock size={14}/> 🚌 Govt Bus Stand: <b>{p.busStandDistanceKm} km</b>
              </p>
            )}
            <p className="muted" style={{margin:0}}>
              <Clock size={14}/> आने-जाने का अनुमान: {p.commuteMinutes} min · महीने का transport अनुमान: ₹1,200
            </p>
          </div>
        </section>

        <section className="detail-card">
          <h3>Resident <em className="title-accent">reviews</em></h3>
          {reviews.map(r=><div key={r.id} style={{padding:'15px 0',borderBottom:'1px solid #e8ece8'}}><b>{r.name}</b> <span className="rating">★ {r.rating}.0</span><p className="muted" style={{marginBottom:0}}>{r.text}</p></div>)}
        </section>

        <div className="demo-note">Verified listing managed via RoomSaathi host network.</div>
      </article>

      <aside className="sticky-card">
        <div className="price">₹{p.rent.toLocaleString()}<small>/month rent</small></div>
        <div className="muted" style={{margin:'5px 0 15px'}}>₹{calculateMonthlyCost(p).toLocaleString()} estimated monthly · ₹{calculateMoveInCost(p).toLocaleString()} move-in</div>
        <button className="btn" style={{width:'100%'}} onClick={()=>setModal('visit')}><CalendarDays size={16}/> Request a visit</button>
        <button className="btn outline" style={{width:'100%',marginTop:9}} onClick={()=>setModal('contact')}><Phone size={16}/> Contact owner</button>
        <p className="muted" style={{textAlign:'center'}}>No payment or booking is made.</p>
      </aside>
    </div>
{modal==='verification'&&<Modal title="About this verification" onClose={()=>setModal('')}><p>This property has been marked as verified in the prototype. No real-world identity or property checks have been completed.</p><button className="btn" onClick={()=>setModal('')}>Got it</button></Modal>}
{modal==='bed'&&<Modal title={`Interested in ${chosen?.bed}?`} onClose={()=>setModal('')}><form className="stack" onSubmit={e=>{e.preventDefault();finish('Request sent successfully. The owner will follow up in this demo.','roomsaathi_lead_requests',{name:(e.currentTarget.elements.namedItem('name') as HTMLInputElement).value,phone:(e.currentTarget.elements.namedItem('phone') as HTMLInputElement).value,bed:chosen})}}><div className="field"><label>Name</label><input className="input" name="name" required defaultValue="Rahul Sharma"/></div><div className="field"><label>Phone</label><input className="input" name="phone" type="tel" required placeholder="98XXXXXXXX"/></div><div className="field"><label>Preferred move-in</label><input className="input" name="date" type="date" defaultValue="2026-10-05"/></div><button className="btn">Send request</button></form></Modal>}
{modal==='contact'&&<Modal title={`Contact ${p.name}`} onClose={()=>setModal('')}><p>How would you like to connect? This prototype does not send real messages.</p><div className="stack"><button className="btn" onClick={()=>finish('Demo WhatsApp request created. No message was sent.','roomsaathi_lead_requests',{kind:'WhatsApp'})}>WhatsApp</button><button className="btn outline" onClick={()=>finish('Demo call request created.','roomsaathi_lead_requests',{kind:'Call'})}>Request call</button><button className="btn outline" onClick={()=>setModal('visit')}>Schedule visit</button></div></Modal>}
{modal==='success'&&<Modal title="Request received" onClose={()=>setModal('')}><div className="dest-icon"><Check/></div><p>{message}</p><p className="muted">Saved locally in this browser · Demo only</p><button className="btn" onClick={()=>setModal('')}>Done</button></Modal>}
    </div>
  );
}
