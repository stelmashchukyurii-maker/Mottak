"use strict";
(function(){
  const input=document.getElementById("scanInput");
  const splitButton=document.getElementById("splitButton");
  if(!input||!splitButton)return;

  const compactCode=value=>String(value||"").toUpperCase().replace(/[^A-Z0-9]/g,"");
  const validFullCode=code=>/^[A-Z0-9]{12}[0-9]{6}[A-Z0-9]{6}$/.test(code);

  function strictSplit(event){
    if(event){event.preventDefault();event.stopImmediatePropagation();}
    const raw=compactCode(input.value);
    if(raw.length<24){
      show(`${t().wrongLength}: ${raw.length}.`,"bad");
      return;
    }

    const code=raw.slice(-24);
    if(!validFullCode(code)){
      show(t().invalid,"bad");
      return;
    }

    input.value=code;
    document.getElementById("serviceCode").value=code.slice(0,12);
    document.getElementById("upperNumber").value=code.slice(12,18);
    document.getElementById("lowerNumber").value=code.slice(18,24);
    renderPartState();

    const extra=raw.length>24
      ? `\n${language==="uk"?"Виявлено кілька кодів. Використано лише останній код із 24 символів.":language==="pl"?"Wykryto kilka kodów. Użyto tylko ostatniego kodu 24-znakowego.":"Flere koder ble oppdaget. Bare den siste 24-tegnskoden ble brukt."}`
      : "";
    show(`${t().prepared}${extra}`,raw.length>24?"warn":"ok");
  }

  input.addEventListener("keydown",event=>{
    if(event.key==="Enter"||event.key==="Tab")strictSplit(event);
  },true);

  splitButton.addEventListener("click",strictSplit,true);

  input.addEventListener("input",()=>{
    const raw=compactCode(input.value);
    if(raw.length>24){
      input.value=raw.slice(-24);
      strictSplit();
    }
  });
})();