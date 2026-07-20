const state={photos:[],canvases:[]};
const $=id=>document.getElementById(id);
const themes={
  cream:{bg:'#F7F0DF',ink:'#17213A',accent:'#F5C84B',soft:'#FFF9EC'},
  navy:{bg:'#111B36',ink:'#FFFFFF',accent:'#F2CC4D',soft:'#26385E'},
  summer:{bg:'#E8F8FF',ink:'#12355B',accent:'#FFD858',soft:'#FFFFFF'}
};

$('photos').addEventListener('change',async e=>{
  const files=[...e.target.files].slice(0,10-state.photos.length);
  for(const file of files){
    if(!file.type.startsWith('image/')) continue;
    const url=URL.createObjectURL(file);
    const img=await loadImage(url);
    state.photos.push({file,url,img});
  }
  renderPhotoList(); e.target.value='';
});

document.querySelectorAll('.template').forEach(el=>el.addEventListener('click',()=>{
  document.querySelectorAll('.template').forEach(x=>x.classList.remove('active'));
  el.classList.add('active');
}));

$('generateBtn').addEventListener('click',generateAlbum);
$('downloadAllBtn').addEventListener('click',async()=>{
  for(let i=0;i<state.canvases.length;i++){
    await new Promise(r=>setTimeout(r,220));
    downloadCanvas(state.canvases[i],`my-story-${String(i+1).padStart(2,'0')}.png`);
  }
});

function renderPhotoList(){
  $('photoList').innerHTML='';
  state.photos.forEach((p,i)=>{
    const d=document.createElement('div'); d.className='photo-thumb';
    d.innerHTML=`<img src="${p.url}" alt="写真${i+1}"><button aria-label="削除">×</button>`;
    d.querySelector('button').onclick=()=>{URL.revokeObjectURL(p.url);state.photos.splice(i,1);renderPhotoList()};
    $('photoList').appendChild(d);
  });
}

async function generateAlbum(){
  const name=$('name').value.trim()||'MY STORY';
  const subtitle=$('subtitle').value.trim()||'PERSONAL MEMORIES';
  const school=$('school').value.trim()||'プロフィールを入力してください';
  const hobby=$('hobby').value.trim()||'好きなことを入力してください';
  const message=$('message').value.trim()||'これからも、たくさんの思い出を。';
  const friendMessage=$('friendMessage').value.trim()||'あなたらしい毎日が、もっと素敵になりますように。';
  const template=document.querySelector('input[name="template"]:checked').value;
  const theme=themes[template];
  const pageCount=Number($('pageCount').value);
  const ratio=$('ratio').value;
  const W=1080,H=ratio==='portrait'?1350:1920;
  const data={name,subtitle,school,hobby,message,friendMessage,theme,W,H};

  state.canvases=[]; $('preview').className='preview-grid'; $('preview').innerHTML='';
  for(let i=0;i<pageCount;i++){
    const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
    drawPage(canvas,i,pageCount,data);
    state.canvases.push(canvas);
    const card=document.createElement('div');card.className='page-card';
    card.appendChild(canvas);
    const actions=document.createElement('div');actions.className='page-actions';
    actions.innerHTML=`<span>${i+1} / ${pageCount}</span><button class="download-btn">PNG保存</button>`;
    actions.querySelector('button').onclick=()=>downloadCanvas(canvas,`my-story-${String(i+1).padStart(2,'0')}.png`);
    card.appendChild(actions);$('preview').appendChild(card);
  }
  $('status').textContent=`${pageCount}枚のアルバムを作成しました。写真や文章を変更して再生成できます。`;
  $('downloadAllBtn').disabled=false;
}

function drawPage(canvas,index,total,d){
  const c=canvas.getContext('2d'); const {W,H,theme}=d;
  c.fillStyle=theme.bg;c.fillRect(0,0,W,H);
  decorate(c,W,H,theme,index);
  if(index===0) drawCover(c,d);
  else if(index===1) drawProfile(c,d);
  else if(index===total-1) drawClosing(c,d);
  else drawMemory(c,d,index,total);
}

function decorate(c,W,H,t,index){
  c.save();c.globalAlpha=.9;c.fillStyle=t.accent;
  c.beginPath();c.arc(W-90,90,65,0,Math.PI*2);c.fill();
  c.globalAlpha=.15;c.beginPath();c.arc(90,H-80,145,0,Math.PI*2);c.fill();
  c.globalAlpha=1;c.fillStyle=t.ink;c.font='700 24px sans-serif';c.fillText(String(index+1).padStart(2,'0'),50,66);c.restore();
}

function drawCover(c,d){
  const {W,H,theme}=d;
  if(state.photos[0]) drawImageCover(c,state.photos[0].img,70,110,W-140,H*.62,36);
  else placeholder(c,70,110,W-140,H*.62,theme);
  c.fillStyle=theme.ink;c.font='800 32px sans-serif';c.fillText(d.subtitle.toUpperCase(),75,H*.78);
  c.font=`900 ${Math.min(96,Math.max(58,900/d.name.length))}px sans-serif`;wrapText(c,d.name,75,H*.86,W-150,100);
  c.fillStyle=theme.accent;c.fillRect(75,H-95,230,14);
}

function drawProfile(c,d){
  const {W,H,theme}=d;
  c.fillStyle=theme.ink;c.font='900 72px sans-serif';c.fillText('ABOUT ME',70,150);
  if(state.photos[1]||state.photos[0]) drawImageCover(c,(state.photos[1]||state.photos[0]).img,70,220,W*.43,H*.48,32);
  else placeholder(c,70,220,W*.43,H*.48,theme);
  const x=W*.57;c.fillStyle=theme.ink;c.font='800 28px sans-serif';c.fillText('NAME',x,280);c.font='900 52px sans-serif';wrapText(c,d.name,x,340,W*.36,58);
  c.font='800 28px sans-serif';c.fillText('SCHOOL',x,500);c.font='600 34px sans-serif';wrapText(c,d.school,x,555,W*.36,46);
  c.font='800 28px sans-serif';c.fillText('FAVORITE',x,720);c.font='600 34px sans-serif';wrapText(c,d.hobby,x,775,W*.36,46);
  c.fillStyle=theme.soft;c.roundRect(70,H-300,W-140,200,30);c.fill();c.fillStyle=theme.ink;c.font='600 34px sans-serif';wrapText(c,d.message,110,H-235,W-220,48);
}

function drawMemory(c,d,index,total){
  const {W,H,theme}=d; const photoStart=2; const p1=state.photos[(index-photoStart)*2]; const p2=state.photos[(index-photoStart)*2+1];
  c.fillStyle=theme.ink;c.font='900 64px sans-serif';c.fillText(index%2?'MEMORY':'MY MOMENT',70,145);
  if(p1&&p2){drawImageCover(c,p1.img,70,210,W-140,(H-390)*.58,28);drawImageCover(c,p2.img,70,250+(H-390)*.58,W-140,(H-390)*.32,28)}
  else if(p1){drawImageCover(c,p1.img,70,210,W-140,H-430,32)}
  else if(state.photos.length){drawImageCover(c,state.photos[index%state.photos.length].img,70,210,W-140,H-430,32)}
  else placeholder(c,70,210,W-140,H-430,theme);
  c.fillStyle=theme.ink;c.font='700 28px sans-serif';c.fillText(`${d.name} • PAGE ${index+1}`,75,H-120);
}

function drawClosing(c,d){
  const {W,H,theme}=d;
  c.fillStyle=theme.ink;c.font='900 78px sans-serif';wrapText(c,'TO BE CONTINUED.',70,200,W-140,90);
  const p=state.photos[state.photos.length-1];
  if(p) drawImageCover(c,p.img,70,360,W-140,H*.42,34); else placeholder(c,70,360,W-140,H*.42,theme);
  c.fillStyle=theme.soft;c.roundRect(70,H*.72,W-140,H*.18,30);c.fill();c.fillStyle=theme.ink;c.font='700 36px sans-serif';wrapText(c,d.friendMessage,115,H*.775,W-230,52);
  c.fillStyle=theme.accent;c.font='900 28px sans-serif';c.fillText(d.name.toUpperCase(),75,H-70);
}

function placeholder(c,x,y,w,h,t){c.fillStyle=t.soft;c.roundRect(x,y,w,h,30);c.fill();c.fillStyle=t.ink;c.globalAlpha=.35;c.font='700 34px sans-serif';c.textAlign='center';c.fillText('ADD YOUR PHOTO',x+w/2,y+h/2);c.textAlign='start';c.globalAlpha=1}
function drawImageCover(c,img,x,y,w,h,r){c.save();roundedPath(c,x,y,w,h,r);c.clip();const ir=img.width/img.height,br=w/h;let sx=0,sy=0,sw=img.width,sh=img.height;if(ir>br){sw=img.height*br;sx=(img.width-sw)/2}else{sh=img.width/br;sy=(img.height-sh)/2}c.drawImage(img,sx,sy,sw,sh,x,y,w,h);c.restore()}
function roundedPath(c,x,y,w,h,r){c.beginPath();c.roundRect(x,y,w,h,r)}
function wrapText(c,text,x,y,maxWidth,lineHeight){const chars=[...text];let line='';for(const ch of chars){const test=line+ch;if(c.measureText(test).width>maxWidth&&line){c.fillText(line,x,y);line=ch;y+=lineHeight}else line=test}if(line)c.fillText(line,x,y)}
function loadImage(src){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src})}
function downloadCanvas(canvas,name){const a=document.createElement('a');a.download=name;a.href=canvas.toDataURL('image/png');a.click()}
