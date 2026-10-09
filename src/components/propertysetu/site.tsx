import { Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowRight, ChevronLeft, ChevronRight, Menu, X, Search, MessageCircle, HousePlus, MapPin, Heart, Wallet, Languages, SlidersHorizontal, CalendarDays, Image, BadgeCheck, Building2, Smartphone, BedDouble, Bath, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png.asset.json';
import { APP_URL, api, money, label } from '@/lib/propertysetu';
export function Brand() { return <Link to="/" className="brand"><img src={logo.url} alt="PropertySetu logo"/><span className="brand-name">Property<span>Setu</span></span></Link>; }
export function OpenApp({children='Open app'}:{children?:React.ReactNode}) { return <Button asChild size="lg"><a href={APP_URL} target="_blank" rel="noopener noreferrer">{children}<ArrowUpRight/></a></Button>; }
export function SiteHeader() { const [open,setOpen]=useState(false); return <header className="site-header"><div className="site-width header-inner"><Brand/><nav aria-label="Main navigation" className={`desktop-nav ${open?'is-open':''}`}><Link to="/how-it-works" onClick={()=>setOpen(false)}>How it works</Link><Link to="/features" onClick={()=>setOpen(false)}>Features</Link><Link to="/listings" onClick={()=>setOpen(false)}>Listings</Link><OpenApp/></nav><Button variant="ghost" size="icon" className="menu-toggle" aria-label={open?'Close menu':'Open menu'} onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</Button></div></header>; }
export function Footer() { return <footer className="site-footer site-width"><div className="footer-top"><div><Brand/><p>Bringing people and places together.</p></div><div className="footer-links"><Link to="/how-it-works">How it works</Link><Link to="/features">Features</Link><Link to="/privacy">Privacy policy</Link><a href={APP_URL} target="_blank" rel="noopener noreferrer">Open app <ArrowUpRight className="inline size-3"/></a></div></div><div className="footer-bottom"><span>© 2026 PropertySetu. All rights reserved.</span><div className="flex gap-6"><span>Made for homes. Made for India.</span><Link to="/admin-preview">Admin preview</Link><Link to="/admin">Admin</Link></div></div></footer>; }
export function Closing() { return <section className="closing" id="play-store"><div className="site-width closing-inner"><div><h2>A new address.<br/>A new beginning.</h2><p>Open PropertySetu on your phone.<br/>Android from Google Play. iPhone from your browser.</p></div><div className="flex flex-wrap gap-3"><OpenApp/><Button asChild variant="outline" size="lg"><a href="#play-store"><Smartphone/>Get the Android app</a></Button></div></div></section>; }
import keys from '@/assets/hero-keys.png.asset.json';
import invest from '@/assets/hero-invest.png.asset.json';
import journey from '@/assets/hero-journey.png.asset.json';
import chapter from '@/assets/hero-chapter.png.asset.json';
const heroSlides=[
 {image:keys,eyebrow:'Buy',title:'Find Your Dream Home',description:'Discover beautiful homes that match your lifestyle, preferences, and budget.',button:'Explore Properties',to:'/listings',alt:'A happy couple holding the keys to their new home at golden hour',position:'50% 40%'},
 {image:invest,eyebrow:'Invest',title:'Invest in a Brighter Tomorrow',description:'Explore residential properties, plots, and commercial spaces for your next investment.',button:'Explore Investments',to:'/listings',alt:'A couple on a city balcony overlooking rising towers at sunset',position:'50% 35%'},
 {image:journey,eyebrow:'Connect',title:'Your Property Journey, Made Easier',description:'Explore property listings and connect with owners and agents to make informed decisions.',button:'Browse Listings',to:'/listings',alt:'An agent discussing plans with a couple in a luxury lounge',position:'50% 45%'},
 {image:chapter,eyebrow:'Begin',title:'Your Next Chapter Starts Here',description:'From searching to shortlisting, find the right property with PropertySetu.',button:'Get Started',to:'/how-it-works',alt:'A couple admiring a luxury villa with a pool at sunset',position:'50% 40%'}
];
export function Hero() {
 const [index,setIndex]=useState(0);
 const [paused,setPaused]=useState(false);
 useEffect(()=>{
  if(paused) return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const timer=setInterval(()=>setIndex(i=>(i+1)%heroSlides.length),6000);
  return ()=>clearInterval(timer);
 },[paused,index]);
 const slide=heroSlides[index];
 return <section className="hero" aria-roledescription="carousel" aria-label="Featured on PropertySetu" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)} onBlurCapture={()=>setPaused(false)}>
  {heroSlides.map((item,i)=><div key={item.title} className={`hero-slide ${i===index?'is-active':''}`} role="group" aria-roledescription="slide" aria-label={`${i+1} of ${heroSlides.length}`} aria-hidden={i!==index}><img className="hero-image" src={item.image.url} alt={item.alt} loading={i===0?'eager':'lazy'} style={{objectPosition:item.position}}/></div>)}
  <div className="hero-shade"/>
  <div className="site-width hero-content">
   <div className="hero-slide-text" key={slide.title}>
    <div className="eyebrow">{slide.eyebrow}</div>
    <h1>{slide.title}</h1>
    <p className="hero-copy">{slide.description}</p>
    <div className="hero-actions">
     <Button asChild size="lg"><Link to={slide.to}>{slide.button}<ArrowRight/></Link></Button>
     <a className="hero-secondary" href={APP_URL} target="_blank" rel="noopener noreferrer">Open app <ArrowUpRight className="size-4"/></a>
    </div>
   </div>
   <div className="hero-bottom"><span className="flex items-center gap-2"><MapPin className="size-3"/> YOUR CITY. YOUR NEIGHBOURHOOD. YOUR HOME.</span><span className="flex items-center gap-2">THERE’S MORE TO EXPLORE <ChevronDown className="size-4"/></span></div>
  </div>
  <button type="button" className="hero-nav prev" aria-label="Previous slide" onClick={()=>setIndex(i=>(i-1+heroSlides.length)%heroSlides.length)}><ChevronLeft/></button>
  <button type="button" className="hero-nav next" aria-label="Next slide" onClick={()=>setIndex(i=>(i+1)%heroSlides.length)}><ChevronRight/></button>
  <div className="hero-dots">{heroSlides.map((item,i)=><button key={item.title} type="button" className={`hero-dot ${i===index?'is-active':''}`} aria-label={`Show slide ${i+1}: ${item.title}`} aria-pressed={i===index} onClick={()=>setIndex(i)}/>)}</div>
 </section>;
}
const steps=[{title:'Start with a place.',text:'Search a city or area. Explore homes that fit your life and your budget.',icon:Search},{title:'Make a connection.',text:'Enquire, schedule a visit, or chat directly with the owner. Get to know your next home.',icon:MessageCircle},{title:'Open your door.',text:'List your home with photos, a video, and a plan. Let the right people find you.',icon:HousePlus}];
export function Steps() { return <section className="section site-width"><div className="section-heading"><div><div className="eyebrow text-primary">Simple by design</div><h2>Your next move, in three steps.</h2></div><p>Less searching in circles.<br/>More moving forward.</p></div><div className="steps">{steps.map((step,i)=><div className="step" key={step.title}><div className="flex justify-between items-center"><span className="step-number">0{i+1}</span><step.icon className="size-5 text-primary"/></div><h3>{step.title}</h3><p>{step.text}</p></div>)}</div></section>; }
const features=[['Browse sale, rent, lease, and PG',Building2],['Search by city, area, price, and type',SlidersHorizontal],['Map of listings near you',MapPin],['Save your favourites',Heart],['List with photos and video',Image],['Standard and premium plans',BadgeCheck],['Wallet for listing fees',Wallet],['Inquiries, visits, and chat',CalendarDays],['English, Hindi, and Gujarati',Languages]] as const;
export function Features() { return <section className="section feature-section"><div className="site-width"><div className="section-heading"><div><div className="eyebrow text-primary">Everything, closer to home</div><h2>A little less effort.<br/>A lot more possibility.</h2></div><p>All the essentials for finding a home or finding its next owner.</p></div><div className="features">{features.map(([text,Icon])=><div className="feature" key={text}><Icon/><span>{text}</span></div>)}</div><p className="text-sm text-muted-foreground mt-5">Monthly or yearly. A plan that works for you.</p></div></section>; }
type Property={id:string;title:string;price:number;listing_type:string;city:string;locality:string;bedrooms:number;bathrooms:number;cover_image?:string};
export function Listings({home=false}:{home?:boolean}) { const [rows,setRows]=useState<Property[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(false); const [attempt,setAttempt]=useState(0); useEffect(()=>{ let active=true; setLoading(true); api<Property[]>('/api/properties?limit=6').then(data=>{if(active){setRows(Array.isArray(data)?data:[]);setError(false);}}).catch(()=>{if(active)setError(true);}).finally(()=>{if(active)setLoading(false);}); return ()=>{active=false;}; },[attempt]); return <section className="section site-width"><div className="section-heading"><div><div className="eyebrow text-primary">Room for your next chapter</div><h2>Discover your next address.</h2></div>{home?<Button variant="link" asChild><Link to="/listings">Explore listings <ArrowRight/></Link></Button>:<OpenApp>Explore in the app</OpenApp>}</div>{loading?<div className="empty-state"><Building2 className="animate-pulse"/><p>Finding homes…</p></div>:rows.length?<div className="property-grid">{rows.map(row=><a key={row.id} href={APP_URL} target="_blank" rel="noopener noreferrer" className="property-card">{row.cover_image?<img className="property-photo" src={row.cover_image} alt={row.title}/>:<div className="property-photo"><Building2 className="text-muted-foreground"/></div>}<div className="property-details"><span className="text-xs text-primary uppercase">For {label(row.listing_type)}</span><h3>{row.title}</h3><p className="text-muted-foreground text-sm flex items-center gap-1"><MapPin className="size-3"/>{[row.locality,row.city].filter(Boolean).join(', ')}</p><div className="flex gap-4 text-sm text-muted-foreground my-4"><span><BedDouble className="inline size-4 mr-1"/>{row.bedrooms} beds</span><span><Bath className="inline size-4 mr-1"/>{row.bathrooms} baths</span></div><p className="font-semibold">{money(row.price)}</p></div></a>)}</div>:<div className="empty-state"><Building2 className="size-8"/><h3>{error?'Homes will be here soon.':'A new home is on the horizon.'}</h3><p>{error?'We couldn’t load the latest listings right now. You can still explore PropertySetu in the app.':'There are no listings to show right now. Check back for new places.'}</p>{error&&<Button variant="link" onClick={()=>setAttempt(attempt+1)}>Try again <ArrowRight/></Button>}</div>}</section>; }
export function PageIntro({eyebrow,title,description}:{eyebrow:string;title:string;description:string}) {return <div className="page-intro"><div className="site-width"><div className="eyebrow text-primary">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div></div>;}
