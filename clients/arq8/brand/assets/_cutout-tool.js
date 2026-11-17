// Flood-fill near-white background from the image border to transparent, with a soft edge.
const sharp=require(process.env.SHARP);
module.exports=async function cutout(input, region, thr=242){
  let img=sharp(input); if(region) img=img.extract(region);
  const {data,info}=await img.ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const W=info.width,H=info.height, bg=new Uint8Array(W*H), q=[];
  const white=i=>{const p=i*4;return data[p+3]<10||(data[p]>=thr&&data[p+1]>=thr&&data[p+2]>=thr)};
  for(let x=0;x<W;x++){q.push(x,(H-1)*W+x)} for(let y=0;y<H;y++){q.push(y*W,y*W+W-1)}
  while(q.length){const i=q.pop(); if(bg[i]||!white(i))continue; bg[i]=1; const x=i%W,y=(i/W)|0;
    if(x>0)q.push(i-1); if(x<W-1)q.push(i+1); if(y>0)q.push(i-W); if(y<H-1)q.push(i+W);}
  for(let i=0;i<W*H;i++){ if(bg[i]) data[i*4+3]=0; else { // soften: pixels next to bg get partial alpha by whiteness
      const x=i%W,y=(i/W)|0; const nb=(x>0&&bg[i-1])||(x<W-1&&bg[i+1])||(y>0&&bg[i-W])||(y<H-1&&bg[i+W]);
      if(nb){const p=i*4,m=Math.min(data[p],data[p+1],data[p+2]); data[p+3]=Math.min(data[p+3],Math.round(255*Math.min(1,(255-m)/40)+60));}}}
  return sharp(data,{raw:{width:W,height:H,channels:4}}).png().toBuffer();
};
