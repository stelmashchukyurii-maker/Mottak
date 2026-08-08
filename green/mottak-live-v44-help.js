"use strict";
(function(){
  const input=document.getElementById("scanInput");
  const activate=document.getElementById("activateScanButton");
  const focusStatus=document.getElementById("focusStatus");
  const focusStatusText=document.getElementById("focusStatusText");
  const meter=document.getElementById("scanMeter");
  const scanCard=document.getElementById("scanCard");
  if(!input||!activate||!focusStatus||!focusStatusText||!meter||!scanCard)return;

  const messages={
    nb:{ready:"Skannerfeltet er aktivt — trykk den fysiske utløseren én gang.",notReady:"Skannerfeltet er ikke aktivt. Trykk «Aktiver skanner».",empty:"Ingen tegn mottatt ennå.",count:n=>`Mottatt: ${n} tegn`,complete:"Komplett kode mottatt: 24 tegn. Kontroller feltene nedenfor.",tooMany:n=>`For mange tegn (${n}). Bare den siste 24-tegnskoden brukes.`},
    pl:{ready:"Pole skanera jest aktywne — naciśnij fizyczny spust jeden raz.",notReady:"Pole skanera nie jest aktywne. Naciśnij «Aktywuj skaner».",empty:"Nie odebrano jeszcze znaków.",count:n=>`Odebrano: ${n} znaków`,complete:"Odebrano pełny kod: 24 znaki. Sprawdź pola poniżej.",tooMany:n=>`Za dużo znaków (${n}). Używany jest tylko ostatni kod 24-znakowy.`},
    uk:{ready:"Поле сканера активне — натисніть фізичний курок один раз.",notReady:"Поле сканера не активне. Натисніть «Активувати сканер».",empty:"Символів ще не отримано.",count:n=>`Отримано: ${n} символів`,complete:"Повний код отримано: 24 символи. Перевірте три поля нижче.",tooMany:n=>`Отримано забагато символів (${n}). Використовується лише останній код із 24 символів.`}
  };

  function lang(){
    const active=document.querySelector("[data-language].active");
    return active&&messages[active.dataset.language]?active.dataset.language:"uk";
  }
  function compact(value){return String(value||"").toUpperCase().replace(/[^A-Z0-9]/g,"");}
  function updateInstructions(){
    const current=lang();
    document.querySelectorAll("[data-guide-language]").forEach(el=>el.classList.toggle("active",el.dataset.guideLanguage===current));
    updateFocus();
    updateMeter();
  }
  function updateFocus(){
    const current=lang();
    const ready=document.activeElement===input;
    focusStatus.classList.toggle("ready",ready);
    input.classList.toggle("scan-ready",ready);
    focusStatusText.textContent=ready?messages[current].ready:messages[current].notReady;
  }
  function updateMeter(){
    const current=lang();
    const n=compact(input.value).length;
    meter.className="scan-meter";
    if(n===0){meter.textContent=messages[current].empty;return;}
    if(n===24){meter.textContent=messages[current].complete;meter.classList.add("good");return;}
    if(n>24){meter.textContent=messages[current].tooMany(n);meter.classList.add("bad");return;}
    meter.textContent=messages[current].count(n);
  }
  function focusInput(){
    try{input.focus({preventScroll:true});}catch{input.focus();}
    updateFocus();
  }
  function activateScanner(){
    scanCard.scrollIntoView({behavior:"smooth",block:"start"});
    setTimeout(focusInput,250);
  }

  activate.addEventListener("click",activateScanner);
  input.addEventListener("focus",updateFocus);
  input.addEventListener("blur",updateFocus);
  input.addEventListener("input",updateMeter);
  document.getElementById("languages")?.addEventListener("click",()=>setTimeout(updateInstructions,0));
  document.getElementById("products")?.addEventListener("click",()=>setTimeout(activateScanner,0));
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)setTimeout(focusInput,250);});

  updateInstructions();
})();