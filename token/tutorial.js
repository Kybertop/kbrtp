(()=>{
  const button=document.getElementById('copy-script');
  const code=document.getElementById('token-script');
  const status=document.getElementById('copy-status');
  button.addEventListener('click',async()=>{
    try{
      await navigator.clipboard.writeText(code.textContent);
      status.textContent='Script copied. Use it only on your own logged-in Discord page.';
    }catch{
      const range=document.createRange();range.selectNodeContents(code);
      const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
      status.textContent='Copy was blocked. The script is selected; copy it manually.';
    }
  });
})();
