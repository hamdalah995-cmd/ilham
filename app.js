const KEY='outfitpos_pro_v3';
const seed={auth:null,store:{name:'Outfit Store',address:'',phone:'',footer:'Terima kasih sudah berbelanja!'},products:[],transactions:[],expenses:[]};
let db=load(),cart=[],currentTx=null,reportPeriod='day';

const $=id=>document.getElementById(id);
function clone(x){return JSON.parse(JSON.stringify(x))}
function load(){
  try{
    const raw=localStorage.getItem(KEY);
    if(raw){
      const x=JSON.parse(raw);
      if(x&&Array.isArray(x.products)&&Array.isArray(x.transactions)){
        if(!Array.isArray(x.expenses))x.expenses=[];
        x.products=x.products.map(p=>({...p,color:p.color||'',supplier:p.supplier||''}));
        x.transactions=x.transactions.map(t=>({...t,status:t.status||'completed',items:(t.items||[]).map(i=>({...i,category:i.category||'Lainnya',cost:i.cost||0}))}));
        return x;
      }
    }
    // Migrate the previous OutfitPOS version if it exists.
    const old=localStorage.getItem('outfitpos_pro_v2');
    if(old){
      const x=JSON.parse(old);
      if(x&&Array.isArray(x.products)&&Array.isArray(x.transactions)){
        x.expenses=[];
        x.products=x.products.map(p=>({...p,color:p.color||'',supplier:p.supplier||''}));
        x.transactions=x.transactions.map(t=>({...t,status:t.status||'completed',items:(t.items||[]).map(i=>({...i,category:i.category||'Lainnya',cost:i.cost||0}))}));
        localStorage.setItem(KEY,JSON.stringify(x));
        return x;
      }
    }
    return clone(seed);
  }catch{return clone(seed)}
}
function save(){localStorage.setItem(KEY,JSON.stringify(db))}
function money(n){return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n)||0)}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function localDate(d=new Date()){const z=new Date(d.getTime()-d.getTimezoneOffset()*60000);return z.toISOString().slice(0,10)}
function dateLabel(d,opts={day:'numeric',month:'short'}){return new Date(d+'T00:00:00').toLocaleDateString('id-ID',opts)}
function notify(s){const t=$('toast');t.textContent=s;t.classList.add('show');clearTimeout(window._toast);window._toast=setTimeout(()=>t.classList.remove('show'),2300)}
function completedTx(){return db.transactions.filter(t=>t.status!=='void')}
function txOn(d){return completedTx().filter(t=>t.date.slice(0,10)===d)}
function startOfWeek(d=new Date()){const x=new Date(d);const day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);x.setHours(0,0,0,0);return x}
function endOfWeek(d=new Date()){const x=startOfWeek(d);x.setDate(x.getDate()+6);return x}
function rangeFor(period){
  const now=new Date(),today=localDate(now);
  if(period==='day')return {start:today,end:today};
  if(period==='week')return {start:localDate(startOfWeek(now)),end:localDate(endOfWeek(now))};
  if(period==='month'){return {start:today.slice(0,8)+'01',end:localDate(new Date(now.getFullYear(),now.getMonth()+1,0))}}
  if(period==='year')return {start:now.getFullYear()+'-01-01',end:now.getFullYear()+'-12-31'};
  return {start:'0000-01-01',end:'9999-12-31'};
}
function txInRange(r){return completedTx().filter(t=>{const d=t.date.slice(0,10);return d>=r.start&&d<=r.end})}
const names={dashboard:'Overview',pos:'Kasir / POS',products:'Produk & Stok',transactions:'Transaksi',reports:'Laporan',expenses:'Pengeluaran',settings:'Pengaturan'};

function hasAccount(){return !!(db.auth&&db.auth.username&&db.auth.password)}
function showLogin(){
  $('setupCard').classList.add('hidden');
  $('loginCard').classList.remove('hidden');
  $('loginUsername').value='';
  $('loginPassword').value='';
  setTimeout(()=>$('loginUsername').focus(),80);
}
function showSetup(){
  $('loginCard').classList.add('hidden');
  $('setupCard').classList.remove('hidden');
  $('setupAccountStep').classList.remove('hidden');
  $('setupStoreStep').classList.add('hidden');
  $('setupForm').reset();
  $('setupFooter').value='Terima kasih sudah berbelanja!';
  document.querySelector('.setup-progress span:nth-of-type(1)').classList.add('active');
  document.querySelector('.setup-progress span:nth-of-type(2)').classList.remove('active');
  setTimeout(()=>$('setupUsername').focus(),80);
}
function login(){
  $('loginPage').classList.add('hidden');
  $('app').classList.remove('hidden');
  fillSettings();
  renderAll();
}
function logout(){
  sessionStorage.removeItem('ok');
  $('app').classList.add('hidden');
  $('loginPage').classList.remove('hidden');
  showLogin();
}
$('loginForm').onsubmit=e=>{
  e.preventDefault();
  if(!hasAccount()) return showSetup();
  const username=$('loginUsername').value.trim();
  const password=$('loginPassword').value;
  if(username===db.auth.username&&password===db.auth.password){
    sessionStorage.ok='1';
    login();
    notify('Login berhasil');
  }else{
    notify('Username atau password salah');
  }
};
$('showSetup').onclick=showSetup;
$('backLogin').onclick=showLogin;
$('nextSetup').onclick=()=>{
  const u=$('setupUsername').value.trim();
  const p=$('setupPassword').value;
  const p2=$('setupPassword2').value;
  if(u.length<3) return notify('Username minimal 3 karakter');
  if(/\s/.test(u)) return notify('Username tidak boleh mengandung spasi');
  if(p.length<6) return notify('Password minimal 6 karakter');
  if(p!==p2) return notify('Konfirmasi password tidak sama');
  $('setupAccountStep').classList.add('hidden');
  $('setupStoreStep').classList.remove('hidden');
  document.querySelector('.setup-progress span:nth-of-type(2)').classList.add('active');
  document.querySelector('.setup-progress span:nth-of-type(1)').classList.add('active');
  setTimeout(()=>$('setupStoreName').focus(),80);
};
$('backSetup').onclick=()=>{
  $('setupStoreStep').classList.add('hidden');
  $('setupAccountStep').classList.remove('hidden');
};
$('setupForm').onsubmit=e=>{
  e.preventDefault();
  const username=$('setupUsername').value.trim();
  const password=$('setupPassword').value;
  const storeName=$('setupStoreName').value.trim();
  if(!storeName) return notify('Nama toko wajib diisi');
  db.auth={username,password};
  db.store={
    name:storeName,
    address:$('setupStoreAddress').value.trim(),
    phone:$('setupStorePhone').value.trim(),
    footer:$('setupFooter').value.trim()||'Terima kasih sudah berbelanja!'
  };
  save();
  sessionStorage.ok='1';
  login();
  notify('Toko berhasil disiapkan');
};
document.querySelectorAll('[data-toggle-password]').forEach(btn=>{
  btn.onclick=()=>{
    const input=$(btn.dataset.togglePassword);
    if(!input)return;
    input.type=input.type==='password'?'text':'password';
    btn.textContent=input.type==='password'?'Lihat':'Sembunyikan';
  };
});
$('logout').onclick=logout;
document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>go(b.dataset.page));
document.querySelectorAll('[data-goto]').forEach(b=>b.onclick=()=>go(b.dataset.goto));
$('openSide').onclick=()=>$('sidebar').classList.add('open');$('closeSide').onclick=()=>$('sidebar').classList.remove('open');
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).classList.add('hidden'));
function go(p){document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));$(p).classList.add('active');document.querySelectorAll('nav button[data-page]').forEach(x=>x.classList.toggle('active',x.dataset.page===p));$('title').textContent=names[p];$('sidebar').classList.remove('open');renderAll()}

function renderAll(){
  $('date').textContent=new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  fillSettings();renderDashboard();renderPOS();renderProducts();renderTransactions();renderReports();renderExpenses()
}
function chartData(period){
  const now=new Date(),r=rangeFor(period),out=[];
  if(period==='day')return [{key:r.start,label:'Hari ini'}];
  if(period==='week'){for(let i=0;i<7;i++){const d=new Date(startOfWeek(now));d.setDate(d.getDate()+i);out.push({key:localDate(d),label:d.toLocaleDateString('id-ID',{weekday:'short'}).slice(0,3)})}return out}
  if(period==='month'){const last=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();for(let i=1;i<=last;i++){const d=new Date(now.getFullYear(),now.getMonth(),i);out.push({key:localDate(d),label:String(i)})}return out}
  if(period==='year'){for(let i=0;i<12;i++){const d=new Date(now.getFullYear(),i,1);out.push({key:localDate(d).slice(0,7),label:d.toLocaleDateString('id-ID',{month:'short'}).slice(0,3)})}return out}
  const tx=completedTx();const months=[...new Set(tx.map(t=>t.date.slice(0,7)))].sort().slice(-12);return months.map(k=>({key:k,label:k}))
}
function chart(id,period='week'){
  const data=chartData(period),vals=data.map(x=>completedTx().filter(t=>period==='year'?t.date.slice(0,7)===x.key:period==='all'?t.date.slice(0,7)===x.key:t.date.slice(0,10)===x.key).reduce((a,t)=>a+t.total,0)),mx=Math.max(...vals,1);
  $(id).innerHTML=data.map((x,i)=>`<div class="barwrap"><em>${vals[i]?money(vals[i]).replace('Rp',''):''}</em><div class="bar" style="height:${Math.max(3,vals[i]/mx*82)}%"></div><small>${esc(x.label)}</small></div>`).join('')||'<div class="empty">Belum ada data.</div>'
}
function renderDashboard(){
  const today=localDate(),tx=txOn(today),sales=tx.reduce((a,t)=>a+t.total,0);
  $('todaySales').textContent=money(sales);$('todayTx').textContent=tx.length;$('todaySalesMeta').textContent=tx.length+' transaksi';$('productCount').textContent=db.products.length;$('stockCount').textContent=db.products.reduce((a,p)=>a+Number(p.stock||0),0)+' unit stok';$('lowStock').textContent=db.products.filter(p=>p.stock>0&&p.stock<=p.min).length;$('outStock').textContent=db.products.filter(p=>p.stock<=0).length+' produk habis';
  chart('dashboardChart','week');
  const counts={};completedTx().forEach(t=>t.items.forEach(i=>counts[i.productId]=(counts[i.productId]||0)+i.qty));
  const top=db.products.map(p=>({...p,sold:counts[p.id]||0})).sort((a,b)=>b.sold-a.sold).slice(0,5);
  $('topProducts').innerHTML=top.length?top.map((p,i)=>`<div class="rank"><i>${i+1}</i><div><strong>${esc(p.name)}</strong><small>${esc(p.category)}</small></div><span>${p.sold} unit</span></div>`).join(''):'<div class="empty">Belum ada penjualan.</div>';
  const recent=[...db.transactions].sort((a,b)=>b.timestamp-a.timestamp).slice(0,6);
  $('recentTransactions').innerHTML=recent.length?`<table class="recent-table">${recent.map(t=>`<tr><td>${esc(t.id)}<br><small>${new Date(t.timestamp).toLocaleString('id-ID')}</small></td><td>${t.status==='void'?'<span class="badge void">Batal</span>':money(t.total)}</td></tr>`).join('')}</table>`:'<div class="empty">Belum ada transaksi.</div>';
  const alerts=db.products.filter(p=>p.stock<=p.min).sort((a,b)=>a.stock-b.stock).slice(0,6);
  $('stockAlerts').innerHTML=alerts.length?alerts.map(p=>`<div class="alert-row"><i class="alert-dot ${p.stock<=0?'out':''}"></i><div><strong>${esc(p.name)}</strong><small>${p.stock<=0?'Stok habis':`Tersisa ${p.stock} unit · minimum ${p.min}`}</small></div><b>${p.stock}</b></div>`).join(''):'<div class="empty">Semua stok aman.</div>'
}

function populateCategories(selectId,includeAll=true){
  const el=$(selectId),old=el.value,cats=[...new Set(db.products.map(p=>p.category).filter(Boolean))].sort();
  el.innerHTML=(includeAll?'<option value="all">Semua kategori</option>':'')+cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');
  if(cats.includes(old)||old==='all')el.value=old;else el.value=includeAll?'all':'';
}
function renderPOS(){
  populateCategories('posCategory');
  const q=($('posSearch').value||'').toLowerCase(),cat=$('posCategory').value;
  const a=db.products.filter(p=>[p.name,p.sku,p.category,p.variant,p.color].join(' ').toLowerCase().includes(q)).filter(p=>cat==='all'||p.category===cat);
  $('posProducts').innerHTML=a.length?a.map(p=>`<div class="product-card ${p.stock<=0?'disabled':''}" data-add="${p.id}"><div class="pimg">${esc((p.name||'PR').slice(0,2).toUpperCase())}</div><div class="pname">${esc(p.name)}</div><div class="pmeta">${esc(p.sku)} · ${esc(p.color||p.variant||p.category)}</div><div class="pbottom"><span class="price">${money(p.price)}</span><span class="badge ${p.stock<=0?'out':p.stock<=p.min?'low':'ok'}">${p.stock<=0?'Habis':p.stock+' stok'}</span></div></div>`).join(''):'<div class="empty">Belum ada produk. Tambahkan produk di menu Produk & Stok.</div>';
  document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{const p=db.products.find(x=>x.id===b.dataset.add);if(p&&p.stock>0)addToCart(p.id);else notify('Produk tidak tersedia')});renderCart()
}
function addToCart(id){const p=db.products.find(x=>x.id===id),line=cart.find(x=>x.id===id);if(!p)return;if(line){if(line.qty<p.stock)line.qty++;else notify('Jumlah melebihi stok')}else cart.push({id,qty:1});renderCart()}
function renderCart(){
  cart=cart.filter(x=>db.products.some(p=>p.id===x.id));
  const subtotal=cart.reduce((a,x)=>{const p=db.products.find(p=>p.id===x.id);return a+p.price*x.qty},0),discount=Math.min(Number($('discount').value)||0,subtotal),total=subtotal-discount;
  $('cartCount').textContent=cart.reduce((a,x)=>a+x.qty,0)+' item';$('subtotal').textContent=money(subtotal);$('total').textContent=money(total);$('cash').disabled=$('payment').value!=='Tunai';$('change').textContent=money(Math.max(0,(Number($('cash').value)||0)-total));
  $('cartItems').innerHTML=cart.length?cart.map(x=>{const p=db.products.find(p=>p.id===x.id);return `<div class="line"><div><strong>${esc(p.name)}</strong><small>${money(p.price)} · stok ${p.stock}</small></div><div class="qty"><button data-q="${p.id}" data-d="-1">−</button><span>${x.qty}</span><button data-q="${p.id}" data-d="1">+</button></div><b>${money(p.price*x.qty)}</b></div>`}).join(''):'<div class="empty">Keranjang masih kosong.<br>Pilih produk di sebelah kiri.</div>';
  document.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>changeQty(b.dataset.q,Number(b.dataset.d)))
}
function changeQty(id,d){const l=cart.find(x=>x.id===id),p=db.products.find(x=>x.id===id);if(!l||!p)return;l.qty+=d;if(l.qty<=0)cart=cart.filter(x=>x!==l);if(l.qty>p.stock)l.qty=p.stock;renderCart()}
$('posSearch').oninput=renderPOS;$('posCategory').onchange=renderPOS;$('discount').oninput=renderCart;$('cash').oninput=renderCart;$('payment').onchange=renderCart;$('clearCart').onclick=()=>{cart=[];renderCart()};
$('checkout').onclick=()=>{
  if(!cart.length)return notify('Keranjang masih kosong');
  const subtotal=cart.reduce((a,x)=>{const p=db.products.find(p=>p.id===x.id);return a+p.price*x.qty},0),discount=Math.min(Number($('discount').value)||0,subtotal),total=subtotal-discount,payment=$('payment').value,cash=Number($('cash').value)||0;
  if(payment==='Tunai'&&cash<total)return notify('Uang diterima belum cukup');
  for(const x of cart){const p=db.products.find(p=>p.id===x.id);if(!p||p.stock<x.qty)return notify('Stok berubah, cek kembali keranjang')}
  const t={id:'TRX-'+Date.now().toString().slice(-8),timestamp:Date.now(),date:new Date().toISOString(),cashier:db.auth.username,payment,subtotal,discount,total,cash,change:payment==='Tunai'?cash-total:0,status:'completed',items:cart.map(x=>{const p=db.products.find(p=>p.id===x.id);return{productId:p.id,name:p.name,category:p.category,price:p.price,cost:p.cost||0,qty:x.qty}})};
  t.items.forEach(i=>db.products.find(p=>p.id===i.productId).stock-=i.qty);db.transactions.push(t);save();cart=[];$('discount').value=0;$('cash').value='';renderAll();openTx(t.id);notify('Transaksi berhasil disimpan')
};

function renderProducts(){
  populateCategories('catFilter');const q=($('productSearch').value||'').toLowerCase(),sf=$('stockFilter').value,cf=$('catFilter').value;
  const totalUnits=db.products.reduce((a,p)=>a+p.stock,0),costValue=db.products.reduce((a,p)=>a+(p.cost*p.stock),0);
  $('inventorySummary').innerHTML=`<div class="mini-stat"><span>SKU aktif</span><strong>${db.products.length}</strong></div><div class="mini-stat"><span>Total unit</span><strong>${totalUnits}</strong></div><div class="mini-stat"><span>Nilai modal stok</span><strong>${money(costValue)}</strong></div><div class="mini-stat"><span>Stok kritis</span><strong>${db.products.filter(p=>p.stock<=p.min).length}</strong></div>`;
  let a=db.products.filter(p=>[p.name,p.sku,p.category,p.variant,p.color,p.supplier].join(' ').toLowerCase().includes(q)).filter(p=>sf==='low'?p.stock>0&&p.stock<=p.min:sf==='out'?p.stock<=0:sf==='safe'?p.stock>p.min:true).filter(p=>cf==='all'||p.category===cf);
  $('productTable').innerHTML=a.length?a.map(p=>{const s=p.stock<=0?['out','Habis']:p.stock<=p.min?['low','Menipis']:['ok','Aman'];return `<tr><td><div class="product-cell"><div class="thumb">${esc((p.name||'PR').slice(0,2).toUpperCase())}</div><div><b>${esc(p.name)}</b><small>${esc([p.variant,p.color].filter(Boolean).join(' · '))}</small></div></div></td><td>${esc(p.sku)}</td><td>${esc(p.category)}</td><td>${money(p.cost)}</td><td>${money(p.price)}</td><td><b>${p.stock}</b></td><td><span class="badge ${s[0]}">${s[1]}</span></td><td><div class="actions"><button class="icon-btn" data-edit="${p.id}" title="Edit">✎</button><button class="icon-btn" data-del="${p.id}" title="Hapus">×</button></div></td></tr>`}).join(''):'<tr><td colspan="8"><div class="empty">Belum ada produk yang cocok.</div></td></tr>';
  document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editProduct(b.dataset.edit));document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>deleteProduct(b.dataset.del))
}
['productSearch','stockFilter','catFilter'].forEach(id=>$(id).oninput=renderProducts);
$('addProduct').onclick=()=>editProduct();$('quickAdd').onclick=()=>editProduct();
$('clearAllProducts').onclick=()=>{if(!db.products.length)return notify('Katalog sudah kosong');if(confirm('Hapus semua produk dari katalog? Riwayat transaksi dan laporan tetap aman.')){db.products=[];cart=[];save();renderAll();notify('Katalog produk dikosongkan')}};
function editProduct(id){
  const p=id&&db.products.find(x=>x.id===id);$('modalTitle').textContent=p?'Edit Produk':'Tambah Produk';$('pid').value=p?.id||'';$('pname').value=p?.name||'';$('psku').value=p?.sku||'';$('pcat').value=p?.category||'';$('pcost').value=p?.cost||0;$('pprice').value=p?.price||'';$('pstock').value=p?.stock??0;$('pmin').value=p?.min??5;$('pvariant').value=p?.variant||'';$('pcolor').value=p?.color||'';$('psupplier').value=p?.supplier||'';$('productModal').classList.remove('hidden')
}
$('productForm').onsubmit=e=>{e.preventDefault();const id=$('pid').value,o={id:id||'p-'+Date.now(),name:$('pname').value.trim(),sku:$('psku').value.trim(),category:$('pcat').value.trim(),cost:Number($('pcost').value)||0,price:Number($('pprice').value)||0,stock:Number($('pstock').value)||0,min:Number($('pmin').value)||0,variant:$('pvariant').value.trim(),color:$('pcolor').value.trim(),supplier:$('psupplier').value.trim()};if(!o.name||!o.sku||!o.category)return notify('Lengkapi data wajib');const duplicate=db.products.find(p=>p.sku.toLowerCase()===o.sku.toLowerCase()&&p.id!==id);if(duplicate)return notify('SKU sudah digunakan produk lain');if(id)db.products[db.products.findIndex(p=>p.id===id)]=o;else db.products.push(o);save();$('productModal').classList.add('hidden');renderAll();notify(id?'Produk diperbarui':'Produk ditambahkan')};
function deleteProduct(id){const p=db.products.find(x=>x.id===id);if(!p)return;if(!confirm(`Hapus "${p.name}" dari katalog? Riwayat transaksi tetap aman.`))return;db.products=db.products.filter(x=>x.id!==id);cart=cart.filter(x=>x.id!==id);save();renderAll();notify('Produk dihapus')}

function renderTransactions(){
  const q=($('txSearch').value||'').toLowerCase(),d=$('txDate').value,p=$('txPayment').value,s=$('txStatus').value;
  const a=[...db.transactions].sort((x,y)=>y.timestamp-x.timestamp).filter(t=>t.id.toLowerCase().includes(q)).filter(t=>!d||t.date.slice(0,10)===d).filter(t=>p==='all'||t.payment===p).filter(t=>s==='all'||(s==='void'?t.status==='void':t.status!=='void'));
  $('txTable').innerHTML=a.length?a.map(t=>`<tr><td><b>${esc(t.id)}</b></td><td>${new Date(t.timestamp).toLocaleString('id-ID')}</td><td>${esc(t.cashier)}</td><td>${t.items.reduce((a,i)=>a+i.qty,0)} unit</td><td>${esc(t.payment)}</td><td><b>${money(t.total)}</b></td><td><span class="badge ${t.status==='void'?'void':'ok'}">${t.status==='void'?'Dibatalkan':'Selesai'}</span></td><td><button class="btn" data-view="${t.id}">Detail</button></td></tr>`).join(''):'<tr><td colspan="8"><div class="empty">Tidak ada transaksi.</div></td></tr>';
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>openTx(b.dataset.view))
}
['txSearch','txDate','txPayment','txStatus'].forEach(id=>$(id).oninput=renderTransactions);

function openTx(id){
  const t=db.transactions.find(x=>x.id===id);if(!t)return;currentTx=id;
  const profit=t.items.reduce((a,i)=>a+(i.price-i.cost)*i.qty,0)-0;
  $('txDetail').innerHTML=`<div class="receipt"><h4>${esc(db.store.name)}</h4><p>${esc(db.store.address)}</p><p>${esc(db.store.phone)}</p><hr>${t.items.map(i=>`<div class="receipt-line"><span>${esc(i.name)} ×${i.qty}</span><span>${money(i.price*i.qty)}</span></div>`).join('')}<hr><div class="receipt-line"><span>Subtotal</span><span>${money(t.subtotal)}</span></div><div class="receipt-line"><span>Diskon</span><span>-${money(t.discount)}</span></div><div class="receipt-line"><b>TOTAL</b><b>${money(t.total)}</b></div><div class="receipt-line"><span>Pembayaran</span><span>${esc(t.payment)}</span></div>${t.payment==='Tunai'?`<div class="receipt-line"><span>Diterima</span><span>${money(t.cash)}</span></div><div class="receipt-line"><span>Kembali</span><span>${money(t.change)}</span></div>`:''}<hr><p>${esc(db.store.footer)}</p><p>${esc(t.id)} · ${new Date(t.timestamp).toLocaleString('id-ID')}</p><p>Estimasi laba kotor: ${money(profit)}</p></div>`;
  $('voidTx').classList.toggle('hidden',t.status==='void');$('print').classList.toggle('hidden',t.status==='void');$('txModal').classList.remove('hidden')
}
$('voidTx').onclick=()=>{
  const t=db.transactions.find(x=>x.id===currentTx);if(!t||t.status==='void')return;if(!confirm('Batalkan transaksi ini? Stok akan dikembalikan.'))return;
  t.items.forEach(i=>{const p=db.products.find(p=>p.id===i.productId);if(p)p.stock+=i.qty});t.status='void';t.voidedAt=new Date().toISOString();save();$('txModal').classList.add('hidden');renderAll();notify('Transaksi dibatalkan dan stok dikembalikan')
};
$('print').onclick=()=>{
  const t=db.transactions.find(x=>x.id===currentTx);if(!t)return;const w=window.open('','_blank','width=420,height=720');if(!w)return;
  const lines=t.items.map(i=>`${esc(i.name)} x${i.qty}  ${money(i.price*i.qty)}`).join('<br>');
  w.document.write(`<html><head><title>${esc(t.id)}</title><style>body{font:13px monospace;padding:18px;max-width:360px;margin:auto}.c{text-align:center}.r{display:flex;justify-content:space-between;margin:6px 0}hr{border:0;border-top:1px dashed #888}</style></head><body><div class="c"><b>${esc(db.store.name)}</b><br>${esc(db.store.address)}<br>${esc(db.store.phone)}</div><hr>${lines}<hr><div class="r"><span>TOTAL</span><b>${money(t.total)}</b></div><div class="r"><span>${esc(t.payment)}</span><span>${money(t.payment==='Tunai'?t.cash:t.total)}</span></div>${t.payment==='Tunai'?`<div class="r"><span>Kembali</span><span>${money(t.change)}</span></div>`:''}<hr><div class="c">${esc(db.store.footer)}<br>${esc(t.id)}<br>${new Date(t.timestamp).toLocaleString('id-ID')}</div><script>window.onload=()=>window.print()</script></body></html>`);w.document.close()
};

function reportTx(){return txInRange(rangeFor(reportPeriod))}
function renderReports(){
  document.querySelectorAll('.period-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.period===reportPeriod));
  const tx=reportTx(),rev=tx.reduce((a,t)=>a+t.total,0),units=tx.reduce((a,t)=>a+t.items.reduce((b,i)=>b+i.qty,0),0),profit=tx.reduce((a,t)=>a+t.items.reduce((b,i)=>b+(i.price-i.cost)*i.qty,0),0);
  $('reportRevenue').textContent=money(rev);$('reportTransactions').textContent=tx.length;$('reportUnits').textContent=units;$('reportProfit').textContent=money(profit);$('reportAverage').textContent=money(tx.length?rev/tx.length:0);
  $('reportRevenueMeta').textContent=reportPeriod==='day'?'hari ini':reportPeriod==='week'?'minggu berjalan':reportPeriod==='month'?'bulan berjalan':reportPeriod==='year'?'tahun berjalan':'seluruh data';
  $('reportChartTitle').textContent=reportPeriod==='day'?'Omzet hari ini':reportPeriod==='week'?'Omzet mingguan':reportPeriod==='month'?'Omzet bulanan':reportPeriod==='year'?'Omzet tahunan':'Omzet seluruh data';
  chart('reportChart',reportPeriod==='all'?'all':reportPeriod);
  const pm={};tx.forEach(t=>pm[t.payment]=(pm[t.payment]||0)+t.total);const pmArr=Object.entries(pm).sort((a,b)=>b[1]-a[1]),pmMax=Math.max(...pmArr.map(x=>x[1]),1);
  $('paymentReport').innerHTML=pmArr.length?pmArr.map(([k,v])=>`<div class="payment-row"><i class="dot"></i><div><strong>${esc(k)}</strong><small>${Math.round(v/rev*100||0)}% omzet</small></div><b>${money(v)}</b></div>`).join(''):'<div class="empty">Belum ada data.</div>';
  const products={};tx.forEach(t=>t.items.forEach(i=>{if(!products[i.productId])products[i.productId]={name:i.name,qty:0,revenue:0};products[i.productId].qty+=i.qty;products[i.productId].revenue+=i.price*i.qty}));
  const tp=Object.values(products).sort((a,b)=>b.qty-a.qty).slice(0,6);
  $('reportTopProducts').innerHTML=tp.length?tp.map((p,i)=>`<div class="rank"><i>${i+1}</i><div><strong>${esc(p.name)}</strong><small>${money(p.revenue)}</small></div><span>${p.qty} unit</span></div>`).join(''):'<div class="empty">Belum ada data.</div>';
  const cats={};tx.forEach(t=>t.items.forEach(i=>cats[i.category||'Lainnya']=(cats[i.category||'Lainnya']||0)+i.price*i.qty));const ca=Object.entries(cats).sort((a,b)=>b[1]-a[1]),mx=Math.max(...ca.map(x=>x[1]),1);
  $('categoryReport').innerHTML=ca.length?ca.map(([k,v])=>`<div class="cat"><div class="cat-top"><b>${esc(k)}</b><span>${money(v)}</span></div><div class="progress"><i style="width:${v/mx*100}%"></i></div></div>`).join(''):'<div class="empty">Belum ada data.</div>'
}
document.querySelectorAll('.period-tabs button').forEach(b=>b.onclick=()=>{reportPeriod=b.dataset.period;renderReports()});
$('reportExport').onclick=()=>{
  const tx=reportTx(),rows=[['ID','Tanggal','Kasir','Pembayaran','Subtotal','Diskon','Total','Item','Status'],...tx.map(t=>[t.id,new Date(t.timestamp).toLocaleString('id-ID'),t.cashier,t.payment,t.subtotal,t.discount,t.total,t.items.reduce((a,i)=>a+i.qty,0),t.status])];
  downloadText(rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n'),'laporan-'+reportPeriod+'-'+localDate()+'.csv','text/csv')
}

function renderExpenses(){
  const month=localDate().slice(0,7),year=localDate().slice(0,4),sum=(arr)=>arr.reduce((a,e)=>a+Number(e.amount||0),0);
  $('expenseMonth').textContent=money(sum(db.expenses.filter(e=>e.date.slice(0,7)===month)));$('expenseYear').textContent=money(sum(db.expenses.filter(e=>e.date.slice(0,4)===year)));$('expenseAll').textContent=money(sum(db.expenses));
  const a=[...db.expenses].sort((x,y)=>y.date.localeCompare(x.date));$('expenseTable').innerHTML=a.length?a.map(e=>`<tr><td>${dateLabel(e.date,{day:'2-digit',month:'short',year:'numeric'})}</td><td>${esc(e.category)}</td><td>${esc(e.note)}</td><td><b>${money(e.amount)}</b></td><td><button class="icon-btn" data-expdel="${e.id}">×</button></td></tr>`).join(''):'<tr><td colspan="5"><div class="empty">Belum ada pengeluaran.</div></td></tr>';
  document.querySelectorAll('[data-expdel]').forEach(b=>b.onclick=()=>{if(confirm('Hapus pengeluaran ini?')){db.expenses=db.expenses.filter(e=>e.id!==b.dataset.expdel);save();renderExpenses();notify('Pengeluaran dihapus')}})
}
$('addExpense').onclick=()=>{$('exDate').value=localDate();$('exNote').value='';$('exAmount').value='';$('expenseModal').classList.remove('hidden')};
$('expenseForm').onsubmit=e=>{e.preventDefault();db.expenses.push({id:'EX-'+Date.now().toString().slice(-8),date:$('exDate').value,category:$('exCategory').value,note:$('exNote').value.trim(),amount:Number($('exAmount').value)||0});save();$('expenseModal').classList.add('hidden');renderExpenses();notify('Pengeluaran tersimpan')};

function fillSettings(){if(!$('storeName'))return;$('storeName').value=db.store.name||'';$('storeAddress').value=db.store.address||'';$('storePhone').value=db.store.phone||'';$('receiptFooter').value=db.store.footer||'Terima kasih sudah berbelanja!';$('newUser').value=db.auth?.username||'';$('sideStore').textContent=db.store.name;const initials=db.store.name.split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase();$('storeAvatar').textContent=initials||'OS'}
$('saveStore').onclick=()=>{db.store={name:$('storeName').value.trim()||'Outfit Store',address:$('storeAddress').value.trim(),phone:$('storePhone').value.trim(),footer:$('receiptFooter').value.trim()};save();fillSettings();notify('Profil toko disimpan')};
$('saveAccount').onclick=()=>{if($('oldPass').value&&$('oldPass').value!==db.auth.password)return notify('Password lama salah');if($('newPass').value&&$('newPass').value.length<6)return notify('Password minimal 6 karakter');db.auth.username=$('newUser').value.trim()||db.auth.username;if($('newPass').value)db.auth.password=$('newPass').value;save();$('oldPass').value='';$('newPass').value='';notify('Akun diperbarui')};

function downloadText(text,name,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function backup(){downloadText(JSON.stringify(db,null,2),'outfitpos-backup-'+localDate()+'.json','application/json');notify('Backup dibuat')}
$('backupBtn').onclick=backup;$('settingsBackup').onclick=backup;
function importData(file){if(!file)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!x.auth||!Array.isArray(x.products)||!Array.isArray(x.transactions))throw 0;if(!Array.isArray(x.expenses))x.expenses=[];db=x;save();renderAll();notify('Data berhasil dipulihkan')}catch{notify('File backup tidak valid')}};r.readAsText(file)}
$('importFile').onchange=e=>{importData(e.target.files[0]);e.target.value=''};$('settingsImport').onchange=e=>{importData(e.target.files[0]);e.target.value=''};
$('csv').onclick=()=>{
  const rows=[['ID','Tanggal','Kasir','Pembayaran','Subtotal','Diskon','Total','Item','Status'],...db.transactions.map(t=>[t.id,new Date(t.timestamp).toLocaleString('id-ID'),t.cashier,t.payment,t.subtotal,t.discount,t.total,t.items.reduce((a,i)=>a+i.qty,0),t.status])];
  downloadText(rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n'),'transaksi-'+localDate()+'.csv','text/csv')
};
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
if(sessionStorage.ok==='1'&&hasAccount()) login();
else if(!hasAccount()) showSetup();
else showLogin();
