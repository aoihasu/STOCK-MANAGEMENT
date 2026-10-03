const SHEETS={
Products:{key:'products',pre:'P',cols:[['id','Product ID','t'],['name','Product Name','t'],['category','Category','t'],['unit','Unit','t'],['vendorId','Vendor ID','r:vendors'],['cost','Cost Price','n'],['price','Selling Price','n'],['opening','Opening Stock','n'],['reorder','Reorder Level','n']]},
Vendors:{key:'vendors',pre:'V',cols:[['id','Vendor ID','t'],['name','Vendor Name','t'],['contact','Contact Person','t'],['phone','Phone','t'],['email','Email','t'],['address','Address','t'],['gstin','GSTIN','t'],['terms','Payment Terms','t']]},
Customers:{key:'customers',pre:'C',cols:[['id','Customer ID','t'],['name','Customer Name','t'],['phone','Phone','t'],['email','Email','t'],['address','Address','t'],['gstin','GSTIN','t']]},
Purchases:{key:'purchases',pre:'PUR-',cols:[['date','Date','d'],['id','Purchase ID','t'],['vendorId','Vendor ID','r:vendors'],['productId','Product ID','r:products'],['qty','Quantity','n'],['cost','Unit Cost','n'],['status','Payment Status','s']]},
Sales:{key:'sales',pre:'INV-',cols:[['date','Date','d'],['id','Invoice No','t'],['customerId','Customer ID','r:customers'],['productId','Product ID','r:products'],['qty','Quantity','n'],['price','Unit Price','n'],['status','Payment Status','s']]}};
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num=v=>Number(v)||0;
const inr=v=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(v||0);
let S={products:[],vendors:[],customers:[],purchases:[],sales:[]},tab='Dashboard',K;
try{const r=localStorage.getItem('stockmgr.v1');if(r)S=Object.assign(S,JSON.parse(r))}catch(e){}
const save=()=>{try{localStorage.setItem('stockmgr.v1',JSON.stringify(S))}catch(e){}};
function toast(m){const t=$('#toast');t.textContent=m;t.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>t.style.display='none',3500)}
function calc(){
 const pq={},sq={};K={P:{},V:{},C:{},vn:{},cn:{},pn:{},tp:0,ts:0,pr:0,pay:0,rec:0};
 S.vendors.forEach(v=>{K.vn[v.id]=v.name;K.V[v.id]={t:0,u:0}});
 S.customers.forEach(c=>{K.cn[c.id]=c.name;K.C[c.id]={t:0,u:0}});
 S.purchases.forEach(r=>{pq[r.productId]=(pq[r.productId]||0)+num(r.qty);const t=num(r.qty)*num(r.cost);K.tp+=t;const v=K.V[r.vendorId];if(v){v.t+=t;if(r.status==='Unpaid')v.u+=t}if(r.status==='Unpaid')K.pay+=t});
 S.sales.forEach(r=>sq[r.productId]=(sq[r.productId]||0)+num(r.qty));
 S.products.forEach(p=>{K.pn[p.id]=p.name;const stock=num(p.opening)+(pq[p.id]||0)-(sq[p.id]||0);
  const st=stock<0?'NEG':stock===0?'OUT':stock<=num(p.reorder)?'REORDER':'OK';
  K.P[p.id]={stock,st,val:stock*num(p.cost),m:num(p.price)?(num(p.price)-num(p.cost))/num(p.price):null}});
 S.sales.forEach(r=>{const t=num(r.qty)*num(r.price),cp=S.products.find(p=>p.id===r.productId);K.ts+=t;K.pr+=t-num(r.qty)*num(cp?.cost);
  const c=K.C[r.customerId];if(c){c.t+=t;if(r.status==='Unpaid')c.u+=t}if(r.status==='Unpaid')K.rec+=t});
}
const badge=s=>`<span class="b ${s}">${{OK:'OK',REORDER:'REORDER',OUT:'OUT OF STOCK',NEG:'CHECK: NEGATIVE'}[s]}</span>`;
const EX={
Products:[['Vendor',r=>esc(K.vn[r.vendorId]||'')],['Stock',r=>K.P[r.id]?.stock??''],['Status',r=>K.P[r.id]?badge(K.P[r.id].st):''],['Stock value',r=>inr(K.P[r.id]?.val)],['Margin',r=>K.P[r.id]?.m==null?'':(K.P[r.id].m*100).toFixed(1)+'%']],
Vendors:[['Total purchased',r=>inr(K.V[r.id]?.t)],['Unpaid',r=>inr(K.V[r.id]?.u)]],
Customers:[['Total sales',r=>inr(K.C[r.id]?.t)],['Amount due',r=>inr(K.C[r.id]?.u)]],
Purchases:[['Vendor',r=>esc(K.vn[r.vendorId]||'')],['Product',r=>esc(K.pn[r.productId]||'')],['Total',r=>inr(num(r.qty)*num(r.cost))]],
Sales:[['Customer',r=>esc(K.cn[r.customerId]||'')],['Product',r=>esc(K.pn[r.productId]||'')],['Total',r=>inr(num(r.qty)*num(r.price))],['Profit',r=>{const p=S.products.find(p=>p.id===r.productId);return inr(num(r.qty)*(num(r.price)-num(p?.cost)))}]]};
function cell(f,t,v){
 if(t[0]==='r'){const list=S[t.slice(2)];const ids=list.map(x=>x.id);if(v&&!ids.includes(v))ids.push(v);
  return `<select data-f="${f}"><option value=""></option>${ids.map(id=>`<option value="${esc(id)}"${id===v?' selected':''}>${esc(id)}${list.find(x=>x.id===id)?' · '+esc(list.find(x=>x.id===id).name):''}</option>`).join('')}</select>`}
 if(t==='s')return `<select data-f="${f}">${['Paid','Unpaid'].map(o=>`<option${o===v?' selected':''}>${o}</option>`).join('')}</select>`;
 return `<input data-f="${f}" type="${t==='n'?'number" step="any':t==='d'?'date':'text'}" value="${esc(v)}">`}
function table(name){
 const c=SHEETS[name],rows=S[c.key];
 const head=c.cols.map(x=>`<th>${x[1]}</th>`).concat((EX[name]||[]).map(x=>`<th>${x[0]}</th>`)).join('')+'<th></th>';
 const body=rows.map((r,i)=>`<tr data-i="${i}">${c.cols.map(([f,l,t])=>`<td>${cell(f,t,r[f])}</td>`).join('')}${EX[name].map(x=>`<td class="calc">${x[1](r)}</td>`).join('')}<td><button class="sec" data-del="${i}" aria-label="Delete row">✕</button></td></tr>`).join('');
 return `<p class="hint">${rows.length} row(s). Grey columns are calculated automatically.</p><div class="wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div><p><button data-add>+ Add row</button></p>`}
function dash(){
 const low=S.products.filter(p=>K.P[p.id]&&K.P[p.id].st!=='OK');
 const cards=[['Products',S.products.length],['Vendors',S.vendors.length],['Customers',S.customers.length],['Stock value (cost)',inr(S.products.reduce((a,p)=>a+K.P[p.id].val,0))],['Total purchases',inr(K.tp)],['Total sales',inr(K.ts)],['Gross profit',inr(K.pr)],['To pay vendors',inr(K.pay)],['To receive',inr(K.rec)],['Need reorder',low.length]];
 return `<div class="cards">${cards.map(([l,v])=>`<div class="card"><span>${l}</span><b>${v}</b></div>`).join('')}</div>
 <h3>Items needing attention</h3>${low.length?`<div class="wrap"><table><thead><tr><th>Product</th><th>Stock</th><th>Reorder level</th><th>Status</th><th>Vendor</th></tr></thead><tbody>${low.map(p=>`<tr><td>${esc(p.name)}</td><td>${K.P[p.id].stock}</td><td>${esc(p.reorder)}</td><td>${badge(K.P[p.id].st)}</td><td>${esc(K.vn[p.vendorId]||'')}</td></tr>`).join('')}</tbody></table></div>`:'<p class="hint">Nothing to reorder. Add products, purchases and sales in the other tabs, or import your Excel file.</p>'}`}
function render(){
 calc();
 $('#nav').innerHTML=['Dashboard',...Object.keys(SHEETS)].map(n=>`<button class="${n===tab?'on':''}" data-tab="${n}">${n}</button>`).join('');
 $('#view').innerHTML=tab==='Dashboard'?dash():table(tab)}
function nextId(c){let m=0;S[c.key].forEach(r=>{const x=/(\d+)$/.exec(r.id||'');if(x)m=Math.max(m,+x[1])});return c.pre+String(m+1).padStart(3,'0')}
document.addEventListener('click',e=>{const t=e.target.closest('[data-tab],[data-add],[data-del]');if(!t)return;
 if(t.dataset.tab){tab=t.dataset.tab;render();return}
 const c=SHEETS[tab];
 if('add' in t.dataset){const r={};c.cols.forEach(([f,l,ty])=>r[f]=ty==='d'?new Date().toISOString().slice(0,10):ty==='s'?'Unpaid':'');r.id=nextId(c);S[c.key].push(r)}
 else S[c.key].splice(+t.dataset.del,1);
 save();render()});
$('#view').addEventListener('change',e=>{const f=e.target.dataset.f,tr=e.target.closest('tr');if(!f||!tr)return;S[SHEETS[tab].key][+tr.dataset.i][f]=e.target.value;save();render()});
function toDate(v){if(v instanceof Date){const d=new Date(v.getTime()+432e5);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
 if(typeof v==='number')return new Date(Math.round((v-25569)*864e5)).toISOString().slice(0,10);return String(v||'').slice(0,10)}
$('#file').addEventListener('change',e=>{const file=e.target.files[0];if(!file)return;if(!window.XLSX)return toast('Excel library did not load');
 const fr=new FileReader();fr.onload=ev=>{try{const wb=XLSX.read(ev.target.result,{type:'array',cellDates:true}),msg=[];
  for(const [name,c] of Object.entries(SHEETS)){const ws=wb.Sheets[name];if(!ws)continue;
   const out=XLSX.utils.sheet_to_json(ws,{defval:''}).map(o=>{const n={};for(const k in o)n[k.split('\n')[0].trim()]=o[k];const r={};
    c.cols.forEach(([f,l,t])=>{const v=n[l];r[f]=t==='d'?toDate(v):t==='n'?(v===''?'':num(v)):String(v??'').trim()});return r}).filter(r=>c.cols[0][2]==='d'?r.productId:r.id);
   S[c.key]=out;msg.push(name+' '+out.length)}
  save();render();toast('Imported: '+(msg.join(', ')||'no matching sheets found'))}catch(err){toast('Could not read that file')}};
 fr.readAsArrayBuffer(file);e.target.value=''});
$('#exp').addEventListener('click',async()=>{if(!window.XLSX)return toast('Excel library did not load');calc();
 const wb=XLSX.utils.book_new();
 for(const [name,c] of Object.entries(SHEETS))XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([c.cols.map(x=>x[1]),...S[c.key].map(r=>c.cols.map(x=>r[x[0]]??''))]),name);
 XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['Product ID','Product Name','Current Stock','Status','Stock Value'],...S.products.map(p=>[p.id,p.name,K.P[p.id].stock,K.P[p.id].st,K.P[p.id].val])]),'Stock Summary');
 const data=XLSX.write(wb,{type:'array',bookType:'xlsx'});
 const dl=await (window.claude?.use?window.claude.use('downloads'):null);
 if(dl){try{await dl.save({filename:'Stock_Data.xlsx',data})}catch(err){if(err.code!=='declined')toast('Could not save the file ('+(err.code||'error')+')')}return}
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:'application/octet-stream'}));a.download='Stock_Data.xlsx';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000)});
render();
