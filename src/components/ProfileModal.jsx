/*await supabase
  .from("profiles")
  .upsert({
    email: user.email,
    preferred_name,
    city,
    province,
    country: "South Africa"
  });

[
 "Western Cape",
 "Gauteng",
 "KwaZulu-Natal",
 "Eastern Cape",
 "Free State",
 "Limpopo",
 "Mpumalanga",
 "North West",
 "Northern Cape"
]*/

// ProfileModal.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { X, MapPin, User } from 'lucide-react';

const cityMap = {
  'Western Cape':['Cape Town','Stellenbosch','Paarl','George','Hermanus','Mossel Bay','Worcester','Ceres'],
  'Gauteng':['Johannesburg','Pretoria','Centurion','Midrand','Soweto','Sandton','Benoni'],
  'KwaZulu-Natal':['Durban','Pietermaritzburg','Umhlanga','Richards Bay','Ballito'],
  'Eastern Cape':['Gqeberha','East London','Mthatha','Grahamstown'],
  'Free State':['Bloemfontein','Welkom','Bethlehem'],
  'Limpopo':['Polokwane','Tzaneen','Thohoyandou'],
  'Mpumalanga':['Mbombela','Witbank','Secunda'],
  'North West':['Rustenburg','Mahikeng','Klerksdorp'],
  'Northern Cape':['Kimberley','Upington']
};

export default function ProfileModal({open,onClose,onSave,initialProfile={}}){
 const [name,setName]=useState('');
 const [province,setProvince]=useState('');
 const [city,setCity]=useState('');
 const [showSug,setShowSug]=useState(false);
 useEffect(()=>{
   setName(initialProfile.display_name||'');
   setProvince(initialProfile.province||'');
   setCity(initialProfile.city||'');
 },[initialProfile,open]);
 const suggestions = useMemo(()=>{
   const list = cityMap[province]||[];
   if(!city) return list.slice(0,6);
   return list.filter(c=>c.toLowerCase().includes(city.toLowerCase())).slice(0,6);
 },[province,city]);
 if(!open) return null;
 const save=()=> onSave?.({display_name:name.trim().slice(0,15),province,city:city.trim()});
 return <div className='fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50'>
   <div className='bg-zinc-900 text-white w-full max-w-md rounded-2xl shadow-xl p-5 space-y-4'>
    <div className='flex justify-between items-center'>
      <h2 className='text-xl font-semibold'>Profile</h2>
      <button onClick={onClose}><X/></button>
    </div>
    <div>
      <label className='text-sm text-zinc-400'>Preferred Name</label>
      <div className='mt-1 flex items-center gap-2 bg-zinc-800 rounded-xl px-3 py-2'>
        <User size={16}/><input maxLength={15} value={name} onChange={e=>setName(e.target.value)} className='bg-transparent outline-none w-full' placeholder='Max 15 characters'/>
      </div>
      <p className='text-xs text-zinc-500 mt-1'>{name.length}/15</p>
    </div>
    <div>
      <label className='text-sm text-zinc-400'>Province</label>
      <select value={province} onChange={e=>{setProvince(e.target.value);setCity('');}} className='mt-1 w-full bg-zinc-800 rounded-xl px-3 py-2'>
        <option value=''>Select province</option>
        {Object.keys(cityMap).map(p=><option key={p}>{p}</option>)}
      </select>
    </div>
    <div className='relative'>
      <label className='text-sm text-zinc-400'>City / Town</label>
      <div className='mt-1 flex items-center gap-2 bg-zinc-800 rounded-xl px-3 py-2'>
        <MapPin size={16}/><input disabled={!province} value={city} onFocus={()=>setShowSug(true)} onChange={e=>{setCity(e.target.value);setShowSug(true);}} className='bg-transparent outline-none w-full disabled:opacity-50' placeholder={province?'Start typing...':'Select province first'}/>
      </div>
      {showSug && province && suggestions.length>0 && <div className='absolute mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden z-10'>
        {suggestions.map(s=><button key={s} onClick={()=>{setCity(s);setShowSug(false);}} className='block w-full text-left px-3 py-2 hover:bg-zinc-700'>{s}</button>)}
      </div>}
      <p className='text-xs text-zinc-500 mt-1'>You can type a custom town if not listed.</p>
    </div>
    <div className='flex gap-2 pt-2'>
      <button onClick={onClose} className='flex-1 bg-zinc-800 rounded-xl py-2'>Cancel</button>
      <button onClick={save} className='flex-1 bg-emerald-600 rounded-xl py-2 font-medium'>Save Profile</button>
    </div>
   </div>
 </div>
}
