import { shareAd, buildPostText } from './share-ad.js';
import { waitlistConfig } from './config.js';
import { submitWaitlist } from './waitlist-client.js';
const $ = (selector) => document.querySelector(selector);
const canvas = $('#share-card');
const context = canvas.getContext('2d');
const mascot = new Image();
let surface = 'X banner';
let selected = 'X banner';
let joined = false;
let imageReady = false;
let shareFile = null;
let renderVersion = 0;
const handleInput = $('#x-handle');
const status = $('#card-status');
const sessionKey = 'forehead-waitlist:ad:v2';
let stage = 'gift';
let welcomeTimer = null;
function saveSession() {
  if (!joined) return;
  try { sessionStorage.setItem(sessionKey, JSON.stringify({joined:true,stage,selected,custom:$('#custom-surface').value,handle:handleInput.value})); } catch { /* The ad still works when browser storage is unavailable. */ }
}
function showAdScreen(animate = true, focus = true) {
  joined = true;
  stage='ad';clearTimeout(welcomeTimer);
  $('#signup-screen').hidden = true;
  $('#welcome-screen').hidden = true;
  $('#ad-screen').hidden = false;
  $('#ad-screen').classList.toggle('entering', animate);
  document.body.classList.add('joined');
  saveSession();
  render();
  if (focus) { $('#ad-title').focus({preventScroll:true}); window.scrollTo({top:0,behavior:'instant'}); }
}
function showGift(focus = true) {
  clearTimeout(welcomeTimer);
  const canMoveFocus=document.activeElement===$('#welcome-title')||document.activeElement===document.body;
  joined=true;stage='gift';
  $('#signup-screen').hidden=true;$('#ad-screen').hidden=true;
  $('#welcome-screen').hidden=false;$('#confirmation-message').hidden=true;
  $('#gift-message').hidden=false;saveSession();
  if(focus&&canMoveFocus)$('#gift-title').focus({preventScroll:true});
}
function confirmSignup() {
  joined=true;stage='gift';saveSession();
  $('#signup-screen').hidden=true;$('#ad-screen').hidden=true;
  $('#welcome-screen').hidden=false;$('#gift-message').hidden=true;
  $('#confirmation-message').hidden=false;
  $('#welcome-title').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});
  welcomeTimer=setTimeout(()=>showGift(),1100);
}
$('#make-ad').addEventListener('click',event=>showAdScreen(event.detail!==0));



function cleanHandle() {
  const value = handleInput.value.trim().replace(/^@/, '');
  return /^[A-Za-z0-9_]{1,15}$/.test(value) ? '@' + value.toUpperCase() : '';
}
function fittedText(text, x, y, maxWidth, maxSize, weight = 750) {
  let size = maxSize;
  while (size > 23) {
    context.font = `${weight} ${size}px "Helvetica Neue", "Segoe UI", sans-serif`;
    if (context.measureText(text).width <= maxWidth) break;
    size -= 1;
  }
  context.fillText(text, x, y);
}
function textLines(value, maxWidth, fontSize) {
  context.font = `750 ${fontSize}px "Helvetica Neue", "Segoe UI", sans-serif`;
  if (context.measureText(value).width <= maxWidth) return [value];
  const words = value.split(/\s+/);
  if (words.length === 1) return [value];
  let first = '';
  let split = 0;
  for (let i=0; i<words.length; i++) {
    const next = (first ? first + ' ' : '') + words[i];
    if (context.measureText(next).width > maxWidth && first) break;
    first=next;split=i+1;
  }
  return [first,words.slice(split).join(' ')].filter(Boolean);
}
function render() {
  if (!imageReady) return;
  surface = selected === 'custom' ? ($('#custom-surface').value.trim() || 'your idea') : selected;
  const handle = cleanHandle();
  const id = ++renderVersion;
  shareFile = null;
  $('#download').disabled=true;$('#share').disabled=true;
  context.clearRect(0,0,1080,1080);
  context.fillStyle='#fff'; context.fillRect(0,0,1080,1080);
  context.drawImage(mascot,174,12,732,732);
  context.save();
  context.translate(540,782);context.rotate(-0.042);
  context.fillStyle='#d8fc4e';
  context.beginPath();context.roundRect(-455,-162,910,324,16);context.fill();
  context.fillStyle='#192014';context.textAlign='center';context.textBaseline='middle';
  const lines=textLines(('MY '+surface).toUpperCase(),810,76);
  const top=lines.length===1?-69:-89;
  lines.forEach((line,i)=>fittedText(line,0,top+i*66,810,76));
  fittedText('IS OPEN FOR ADS.',0,lines.length===1?29:52,815,71);
  context.fillStyle='#4d602b';
  fittedText(handle ? `DM ${handle} TO BOOK` : 'DM ME TO BOOK',0,117,790,28,550);
  context.restore();
  $('#ad-preview').setAttribute('aria-label',`Blue Forehead character. My ${surface} is open for ads. ${handle ? 'DM '+handle+' to book.' : 'DM me to book.'}`);
  $('#sign-surface').textContent=('MY '+surface).toUpperCase();
  $('#sign-surface').style.fontSize=(('MY '+surface).length>20?'4.5cqw':'6.6cqw');
  $('#sign-handle').textContent=handle ? `DM ${handle} TO BOOK` : 'DM ME TO BOOK';
  saveSession();
  canvas.toBlob(blob=>{
    if(!blob || id!==renderVersion)return;
    shareFile=new File([blob], 'forehead-my-ad.png',{type:'image/png'});
    $('#download').disabled=!joined;$('#share').disabled=!joined;
  },'image/png');
}
mascot.onload=()=>{imageReady=true;$('#image-error').hidden=true;render();};
mascot.onerror=()=>{$('#image-error').hidden=false;};
mascot.src='./mascot.png';
$('#retry-image').addEventListener('click',()=>{mascot.src='./mascot.png?retry='+Date.now();});

for (const button of document.querySelectorAll('[data-surface]')) {
  button.addEventListener('click',()=>{
    selected=button.dataset.surface;
    for (const other of document.querySelectorAll('[data-surface]')) {
      const isSelected=other===button;
      other.classList.toggle('active',isSelected);
      other.setAttribute('aria-pressed',String(isSelected));
    }
    $('#custom-field').hidden=selected!=='custom';
    if(selected==='custom')$('#custom-surface').focus();
    render();
  });
}
$('#custom-surface').addEventListener('input',render);
handleInput.addEventListener('input',()=>{
  handleInput.value=handleInput.value.toUpperCase();
  const value=handleInput.value.trim();
  handleInput.setCustomValidity(value&&!/^@?[A-Za-z0-9_]{1,15}$/.test(value)?'Use 1–15 letters, numbers or underscores.':'');
  render();
});
function checkHandle() {
  if(handleInput.value.trim()&&!handleInput.checkValidity()) {
    handleInput.reportValidity();return false;
  }
  return true;
}
function downloadPng() {
  if(!joined||!shareFile||!checkHandle())return false;
  const url=URL.createObjectURL(shareFile);
  const link=document.createElement('a');link.href=url;link.download='forehead-my-ad.png';
  document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
  return true;
}
$('#download').addEventListener('click',()=>{if(downloadPng())status.textContent='PNG saved.';});
$('#share').addEventListener('click',async()=>{
  if(!joined||!shareFile||!checkHandle())return;
  const shareButton=$('#share');shareButton.disabled=true;status.textContent='';$('#x-compose').hidden=true;
  const composer=new URL('https://x.com/intent/tweet');composer.searchParams.set('text',buildPostText(surface));$('#x-compose').href=composer.toString();
  try {
    await shareAd({file:shareFile,surface,onStatus:message=>{status.textContent=message;$('#x-compose').hidden=!/^(Image copied|PNG saved)/.test(message);},download:downloadPng});
  } catch {status.textContent='Could not share. Please try again or download your image.';}
  finally {shareButton.disabled=!shareFile;}
});
$('#waitlist-form').addEventListener('submit',async event=>{
  event.preventDefault();
  const form=event.currentTarget;
  if(!form.reportValidity())return;
  const button=$('#join');
  if(button.disabled)return;
  button.disabled=true;button.textContent='Joining…';$('#form-status').textContent='';
  try {
    await submitWaitlist({email:$('#email').value,consent:true,website:$('#website').value},{config:waitlistConfig});
    $('#email').value='';confirmSignup();status.textContent='';
  } catch(error) {
    $('#form-status').textContent=error.message || 'Could not connect. Please try again.';
  } finally {button.disabled=false;button.textContent='Join waitlist';}
});
$('#privacy-open').addEventListener('click',()=>$('#privacy').showModal());
$('#privacy-close').addEventListener('click',()=>$('#privacy').close());
$('#privacy').addEventListener('click',event=>{if(event.target===$('#privacy')){const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)event.target.close();}});

try {
  const stored=JSON.parse(sessionStorage.getItem(sessionKey)||'null');
  if(stored?.joined===true) {
    if(['X banner','T-shirt','forehead','custom'].includes(stored.selected))selected=stored.selected;
    $('#custom-surface').value=typeof stored.custom==='string'?stored.custom.slice(0,28):'';
    handleInput.value=typeof stored.handle==='string'?stored.handle.slice(0,16).toUpperCase():'';
    $('#custom-field').hidden=selected!=='custom';
    for(const choice of document.querySelectorAll('[data-surface]')) {
      const active=choice.dataset.surface===selected;
      choice.classList.toggle('active',active);choice.setAttribute('aria-pressed',String(active));
    }
    if(stored.stage==='ad')showAdScreen(false,false);else showGift(false);
  }
} catch { /* Start at signup if browser storage is absent or malformed. */ }
