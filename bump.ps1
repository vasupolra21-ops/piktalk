(Get-Content 'public/index.html') -replace 'v=101','v=102' | Set-Content 'public/index.html'
Write-Host "Done"
