const SHEETS={
Products:{key:'products',pre:'P',cols:[['id','Product ID','t'],['name','Product Name','t'],['category','Category','t'],['unit','Unit','t'],['vendorId','Vendor ID','r:vendors'],['cost','Cost Price','n'],['price','Selling Price','n'],['gst','GST %','n'],['opening','Opening Stock','n'],['reorder','Reorder Level','n']]},
Vendors:{key:'vendors',pre:'V',cols:[['id','Vendor ID','t'],['name','Vendor Name','t'],['contact','Contact Person','t'],['phone','Phone','t'],['email','Email','t'],['address','Address','t'],['gstin','GSTIN','t'],['terms','Payment Terms','t']]},
Customers:{key:'customers',pre:'C',cols:[['id','Customer ID','t'],['name','Customer Name','t'],['contact','Contact Person','t'],['phone','Phone','t'],['email','Email','t'],['address','Address','t'],['gstin','GSTIN','t']]},
Purchases:{key:'purchases',pre:'PUR-',cols:[['date','Date','d'],['id','Purchase ID','t'],['vendorId','Vendor ID','r:vendors'],['productId','Product ID','r:products'],['qty','Quantity','n'],['cost','Unit Cost','n'],['status','Payment Status','s']]},
Sales:{key:'sales',pre:'INV-',cols:[['date','Date','d'],['id','Invoice No','t'],['customerId','Customer ID','r:customers'],['productId','Product ID','r:products'],['qty','Quantity','n'],['price','Unit Price','n'],['status','Payment Status','s']]}};
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num=v=>Number(v)||0;
const inr=v=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(v||0);
let S={products:[],vendors:[],customers:[],purchases:[],sales:[],cfg:{name:'',gstin:'',address:'',phone:'',cc:'91'}},tab='Dashboard',q='',K;
try{const r=localStorage.getItem('stockmgr.v1');if(r)S=Object.assign(S,JSON.parse(r))}catch(e){}
const DCFG={name:'Avon Footwear Machines',address:'Plot No. 112, KH No. 22/23, Meera Enclave, Ranhola, New Delhi 110041',gstin:'07FSAPR8346K1Z4',email:'afmindia98@gmail.com',cc:'91',bank:'HDFC BANK',acno:'50200070797181',ifsc:'HDFC0000328',branch:'C BLOCK VIKAS PURI, DELHI',terms:'Valid for 15 Days.\nPayment Terms : 100% Payment in Advance.\nPrice : Ex-Works Delhi.\nTRANSPORTATION CHARGES will be additional.\nMachine Installation, Services and Spare Parts Chargeable.\nWe are not responsible for any loss or damaged incurred during transportation of the goods.\nThe goods will remain exclusive property of Avon Footwear Machines until full & final payment has been received.'};
for(const k in DCFG)if(!S.cfg[k])S.cfg[k]=DCFG[k];
const save=()=>{try{localStorage.setItem('stockmgr.v1',JSON.stringify(S))}catch(e){}};
function toast(m){const t=$('#toast');t.textContent=m;t.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>t.style.display='none',3500)}
const prod=id=>S.products.find(p=>p.id===id);
const biz=()=>S.cfg.name||'our business';
/* GST: prices are entered WITHOUT GST; the product's GST % is added on top */
const line=(r,k)=>{const tx=num(r.qty)*num(k==='s'?r.price:r.cost),g=tx*num(prod(r.productId)?.gst)/100;return{tx,g,tot:tx+g}};
/* WhatsApp: opens a chat with a ready-typed message; you press Send yourself */
function wa(ph,txt){let d=String(ph||'').replace(/\D/g,'').replace(/^0+/,'');if(!d)return '<span class="hint">no phone</span>';if(d.length===10)d=(S.cfg.cc||'91')+d;
 return `<a class="btn wa" target="_blank" rel="noopener" href="https://wa.me/${d}?text=${encodeURIComponent(txt)}">WhatsApp</a>`}
const vph=id=>S.vendors.find(v=>v.id===id)?.phone,cph=id=>S.customers.find(v=>v.id===id)?.phone;
function calc(){
 const pq={},sq={};K={P:{},V:{},C:{},vn:{},cn:{},pn:{},tp:0,ts:0,pr:0,pay:0,rec:0,gin:0,gout:0,low:0};
 S.vendors.forEach(v=>{K.vn[v.id]=v.name;K.V[v.id]={t:0,u:0}});
 S.customers.forEach(c=>{K.cn[c.id]=c.name;K.C[c.id]={t:0,u:0}});
 S.purchases.forEach(r=>{pq[r.productId]=(pq[r.productId]||0)+num(r.qty);const l=line(r,'p');K.tp+=l.tot;K.gin+=l.g;const v=K.V[r.vendorId];if(v){v.t+=l.tot;if(r.status==='Unpaid')v.u+=l.tot}if(r.status==='Unpaid')K.pay+=l.tot});
 S.sales.forEach(r=>{sq[r.productId]=(sq[r.productId]||0)+num(r.qty);const l=line(r,'s');K.ts+=l.tot;K.gout+=l.g;K.pr+=l.tx-num(r.qty)*num(prod(r.productId)?.cost);const c=K.C[r.customerId];if(c){c.t+=l.tot;if(r.status==='Unpaid')c.u+=l.tot}if(r.status==='Unpaid')K.rec+=l.tot});
 S.products.forEach(p=>{K.pn[p.id]=p.name;const stock=num(p.opening)+(pq[p.id]||0)-(sq[p.id]||0);
  const st=stock<0?'NEG':stock===0?'OUT':stock<=num(p.reorder)?'REORDER':'OK';if(st!=='OK')K.low++;
  K.P[p.id]={stock,st,val:stock*num(p.cost),m:num(p.price)?(num(p.price)-num(p.cost))/num(p.price):null}});
}
const badge=s=>`<span class="b ${s}">${{OK:'OK',REORDER:'REORDER',OUT:'OUT OF STOCK',NEG:'CHECK: NEGATIVE'}[s]}</span>`;
const lowMsg=p=>wa(vph(p.vendorId),`Hello ${K.vn[p.vendorId]||''}, we are running low on ${p.name} (only ${K.P[p.id].stock} ${p.unit||'units'} left). Please share availability and rates. - ${biz()}`);
const payMsg=(r,k)=>{const l=line(r,k),n=k==='s'?K.cn[r.customerId]:K.vn[r.vendorId],ph=k==='s'?cph(r.customerId):vph(r.vendorId),u=r.status==='Unpaid';
 const t=k==='s'?(u?`Dear ${n}, payment of ${inr(l.tot)} for invoice ${r.id} is pending. Kindly pay at the earliest. - ${biz()}`:`Dear ${n}, we have received ${inr(l.tot)} for invoice ${r.id}. Thank you! - ${biz()}`)
  :(u?`Hello ${n}, payment of ${inr(l.tot)} for purchase ${r.id} is pending and will be cleared soon. - ${biz()}`:`Hello ${n}, payment of ${inr(l.tot)} for purchase ${r.id} has been made. Thank you. - ${biz()}`);
 return wa(ph,t)};
const EX={
Products:[['Vendor',r=>esc(K.vn[r.vendorId]||'')],['Stock',r=>K.P[r.id]?.stock??''],['Status',r=>K.P[r.id]?badge(K.P[r.id].st):''],['Stock value',r=>inr(K.P[r.id]?.val)],['Margin',r=>K.P[r.id]?.m==null?'':(K.P[r.id].m*100).toFixed(1)+'%'],['Reorder',r=>K.P[r.id]&&K.P[r.id].st!=='OK'?lowMsg(r):'']],
Vendors:[['Total purchased',r=>inr(K.V[r.id]?.t)],['Unpaid',r=>inr(K.V[r.id]?.u)]],
Customers:[['Total sales',r=>inr(K.C[r.id]?.t)],['Amount due',r=>inr(K.C[r.id]?.u)],['Remind',r=>{const d=K.C[r.id]?.u||0;return wa(r.phone,d?`Dear ${r.name}, your total outstanding with ${biz()} is ${inr(d)}. Kindly pay at the earliest. Thank you.`:`Dear ${r.name}, your account with ${biz()} is clear. Thank you!`)}]],
Purchases:[['Vendor',r=>esc(K.vn[r.vendorId]||'')],['Product',r=>esc(K.pn[r.productId]||'')],['GST',r=>inr(line(r,'p').g)],['Total incl. GST',r=>inr(line(r,'p').tot)],['Payment msg',r=>payMsg(r,'p')]],
Sales:[['Customer',r=>esc(K.cn[r.customerId]||'')],['Product',r=>esc(K.pn[r.productId]||'')],['GST',r=>inr(line(r,'s').g)],['Total incl. GST',r=>inr(line(r,'s').tot)],['Profit',r=>inr(line(r,'s').tx-num(r.qty)*num(prod(r.productId)?.cost))],['Invoice',r=>`<button class="sec" data-inv="${esc(r.id)}">Print</button>`],['Payment msg',r=>payMsg(r,'s')]]};
function cell(f,t,v){
 if(t[0]==='r'){const list=S[t.slice(2)];const ids=list.map(x=>x.id);if(v&&!ids.includes(v))ids.push(v);
  return `<select data-f="${f}"><option value=""></option>${ids.map(id=>`<option value="${esc(id)}"${id===v?' selected':''}>${esc(id)}${list.find(x=>x.id===id)?' · '+esc(list.find(x=>x.id===id).name):''}</option>`).join('')}</select>`}
 if(t==='s')return `<select data-f="${f}">${['Paid','Unpaid'].map(o=>`<option${o===v?' selected':''}>${o}</option>`).join('')}</select>`;
 return `<input data-f="${f}" type="${t==='n'?'number" step="any':t==='d'?'date':'text'}" value="${esc(v)}">`}
function table(name){
 const c=SHEETS[name],rows=S[c.key],ql=q.trim().toLowerCase();
 const vis=rows.map((r,i)=>[r,i]).filter(([r])=>!ql||(Object.values(r).join(' ')+' '+(K.P[r.id]&&name==='Products'?K.P[r.id].st:'')).toLowerCase().includes(ql));
 const head=c.cols.map(x=>`<th>${x[1]}</th>`).concat(EX[name].map(x=>`<th>${x[0]}</th>`)).join('')+'<th></th>';
 const body=vis.map(([r,i])=>`<tr data-i="${i}">${c.cols.map(([f,l,t])=>`<td>${cell(f,t,r[f])}</td>`).join('')}${EX[name].map(x=>`<td class="calc">${x[1](r)}</td>`).join('')}<td><button class="sec" data-del="${i}" aria-label="Delete row">✕</button></td></tr>`).join('');
 return `<p class="hint">Showing ${vis.length} of ${rows.length} row(s). Grey columns are calculated. Prices are entered without GST.</p><div class="wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div><p><button data-add>+ Add row</button></p>`}
function dash(){
 const low=S.products.filter(p=>K.P[p.id]&&K.P[p.id].st!=='OK'),g=S.cfg;
 const cards=[['Products',S.products.length],['Vendors',S.vendors.length],['Customers',S.customers.length],['Stock value (cost)',inr(S.products.reduce((a,p)=>a+K.P[p.id].val,0))],['Total purchases (incl. GST)',inr(K.tp)],['Total sales (incl. GST)',inr(K.ts)],['Gross profit (excl. GST)',inr(K.pr)],['To pay vendors',inr(K.pay)],['To receive',inr(K.rec)],['GST collected',inr(K.gout)],['GST paid on purchases',inr(K.gin)],['Net GST payable',inr(K.gout-K.gin)]];
 const f=(k,l)=>`<label>${l}<input data-cfg="${k}" value="${esc(g[k])}"></label>`;
 return `<div class="cards">${cards.map(([l,v])=>`<div class="card"><span>${l}</span><b>${v}</b></div>`).join('')}</div>
 <h3>Low stock</h3>${low.length?`<div class="wrap"><table><thead><tr><th>Product</th><th>Stock</th><th>Reorder level</th><th>Status</th><th>Vendor</th><th>Message vendor</th></tr></thead><tbody>${low.map(p=>`<tr><td>${esc(p.name)}</td><td>${K.P[p.id].stock}</td><td>${esc(p.reorder)}</td><td>${badge(K.P[p.id].st)}</td><td>${esc(K.vn[p.vendorId]||'')}</td><td>${lowMsg(p)}</td></tr>`).join('')}</tbody></table></div>`:'<p class="hint">Nothing is low on stock.</p>'}
 <h3>Business details (used on invoices and WhatsApp messages)</h3><div class="form">${f('name','Business name')}${f('gstin','Your GSTIN')}${f('address','Address')}${f('phone','Phone')}${f('email','Email')}${f('cc','Country code for 10-digit numbers')}${f('bank','Bank name')}${f('acno','Account no.')}${f('ifsc','IFSC code')}${f('branch','Bank branch')}<label style="grid-column:1/-1">Terms &amp; conditions (one per line)<textarea data-cfg="terms" rows="7">${esc(g.terms)}</textarea></label></div>`}
function render(){
 calc();
 $('#nav').innerHTML=['Dashboard',...Object.keys(SHEETS)].map(n=>`<button class="${n===tab?'on':''}" data-tab="${n}">${n}</button>`).join('');
 $('#q').hidden=tab==='Dashboard';
 $('#alert').innerHTML=K.low&&tab!=='Dashboard'?`<button class="warnbar" data-tab="Dashboard">⚠ ${K.low} item(s) low on stock — tap to view and message vendors</button>`:'';
 $('#view').innerHTML=tab==='Dashboard'?dash():table(tab)}
function nextId(c){let m=0;S[c.key].forEach(r=>{const x=/(\d+)$/.exec(r.id||'');if(x)m=Math.max(m,+x[1])});return c.pre+String(m+1).padStart(3,'0')}
const fmt=v=>new Intl.NumberFormat('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2}).format(v||0);
const nl=s=>esc(s).replace(/\n/g,'<br>');
const longDate=s=>{const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(s||'');return m?new Date(+m[1],+m[2]-1,+m[3]).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}).toUpperCase():esc(s)};
function invoice(no){
 const rows=S.sales.filter(r=>r.id===no);if(!rows.length)return;
 const c=S.customers.find(x=>x.id===rows[0].customerId)||{},g=S.cfg;let tot=0;
 const body=rows.map((r,i)=>{const l=line(r,'s'),p=prod(r.productId)||{};tot+=l.tot;return `<tr><td>${i+1}.</td><td>${esc(p.name||r.productId)}</td><td>${num(r.qty)} ${esc(p.unit||'')}</td><td>${fmt(r.price)}</td><td>${num(p.gst)}%</td><td>${fmt(l.g)}</td><td>${fmt(l.tot)}</td></tr>`}).join('');
 const terms=String(g.terms||'').split('\n').filter(x=>x.trim()).map(x=>`<li>${esc(x)}</li>`).join('');
 $('#inv').innerHTML=`<div class="iv-top"><img src="logo.png" alt="" class="iv-logo" onerror="this.style.visibility='hidden'"><div class="iv-name">${esc(g.name||'Your Business')}</div></div><div class="iv-line"></div>
 <div class="iv-r"><div class="iv-addr">${nl(g.address)}</div><div>GSTIN : ${esc(g.gstin)}</div><div>Email Id : ${esc(g.email)}</div></div>
 <div class="iv-mid"><div class="iv-title">TAX INVOICE</div><div class="iv-ref"><div><b>Date:</b> ${longDate(rows[0].date)}</div><div><b>Invoice No:</b> <i>${esc(no)}</i></div></div></div>
 <div class="iv-two"><div class="iv-to">TO<br>${esc(c.name||rows[0].customerId)}<br>${nl(c.address)}<br>GSTIN ${esc(c.gstin)}<br><br>RECEIVER NAME : ${esc(c.contact)}<br>MOBILE NO : ${esc(c.phone)}</div>
 <div class="iv-bank"><div class="iv-bh">BANK DETAILS :</div>BANK NAME : ${esc(g.bank)}<br>A/C NO. : ${esc(g.acno)}<br>IFSC CODE : ${esc(g.ifsc)}<br>BRANCH : ${esc(g.branch)}</div></div>
 <div class="iv-band">PAYMENT STATUS : ${esc(rows[0].status).toUpperCase()}</div>
 <table class="iv-t"><thead><tr><th>S.No.</th><th>DESCRIPTION</th><th>QTY</th><th>UNIT PRICE</th><th>GST</th><th>GST AMOUNT</th><th>TOTAL AMOUNT</th></tr></thead><tbody>${body}</tbody></table>
 <div class="iv-tot"><span>TOTAL AMOUNT</span><b>${fmt(tot)}</b></div>
 <div class="iv-terms"><b>Terms &amp; Conditions</b><ol>${terms}</ol></div>
 <div class="iv-sign"><div>${esc(g.name)}</div><div class="iv-gap"></div><div>Authorized Signature</div></div>`;
 try{window.print()}catch(e){toast('Printing is blocked in this view')}}
document.addEventListener('click',e=>{const t=e.target.closest('[data-tab],[data-add],[data-del],[data-inv]');if(!t)return;
 if(t.dataset.tab){tab=t.dataset.tab;q='';$('#q').value='';render();return}
 if(t.dataset.inv){invoice(t.dataset.inv);return}
 const c=SHEETS[tab];
 if('add' in t.dataset){const r={};c.cols.forEach(([f,l,ty])=>r[f]=ty==='d'?new Date().toISOString().slice(0,10):ty==='s'?'Unpaid':f==='gst'?18:'');r.id=nextId(c);S[c.key].push(r)}
 else if(confirm('Delete this row?'))S[c.key].splice(+t.dataset.del,1);else return;
 save();render()});
$('#q').addEventListener('input',e=>{q=e.target.value;render()});
$('#view').addEventListener('change',e=>{const d=e.target.dataset;
 if(d.cfg){S.cfg[d.cfg]=e.target.value;save();return}
 const tr=e.target.closest('tr');if(!d.f||!tr)return;const row=S[SHEETS[tab].key][+tr.dataset.i];row[d.f]=e.target.value;if(d.f==='productId'){const p=prod(e.target.value);if(p){if(tab==='Sales'&&p.price!=='')row.price=p.price;if(tab==='Purchases'&&p.cost!=='')row.cost=p.cost}}save();render()});
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
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:'application/octet-stream'}));a.download='Stock_Data.xlsx';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000)});
render();
