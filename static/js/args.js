const urlParams = new URLSearchParams(window.location.search)
const args = JSON.parse(urlParams.get('args') || '{}')
console.log('Renderer process arguments:', args)
