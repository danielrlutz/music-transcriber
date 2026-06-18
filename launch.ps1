# Launch script for MT3 Web UI Container
Write-Host "==============================================="
Write-Host "    MT3 Web UI Container Launchpad"
Write-Host "==============================================="

# Get the local IPv4 address
$ipV4 = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch 'Loopback' -and $_.InterfaceAlias -notmatch 'vEthernet' }).IPAddress | Select-Object -First 1

Write-Host "Your Local LAN IP is: $ipV4"
Write-Host "Other devices on your network can access the web app at: http://$($ipV4):3000"
Write-Host "-----------------------------------------------"
Write-Host "Building and starting the Docker container..."

docker-compose up --build -d

Write-Host "-----------------------------------------------"
Write-Host "Container started in detached mode."
Write-Host "To view logs, run: docker-compose logs -f"
Write-Host "==============================================="
