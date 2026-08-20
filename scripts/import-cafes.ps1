param(
  [Parameter(Mandatory = $true)]
  [string]$SourceCsv,
  [Parameter(Mandatory = $true)]
  [string]$DestinationJson
)

$rows = @(Import-Csv -LiteralPath $SourceCsv)
$index = 0

$cafes = @($rows | ForEach-Object {
  $index++
  $slug = (($_.Cafe.ToLowerInvariant() -replace '&', ' and ' -replace '[^a-z0-9]+', '-').Trim('-'))

  [ordered]@{
    id = ('cafe-{0:d2}' -f $index)
    slug = $slug
    name = $_.Cafe
    category = 'cafe'
    area = $_.Area
    city = $_.City
    address = $_.Address
    costForTwo = [int]$_.'INR for 2 (approx)'
    foodScore = [int]$_.foodScore
    mustOrder = @($_.mustOrder -split '; ')
    foodNote = $_.foodNote
    wifi = ($_.'Wi-Fi' -eq 'Yes')
    workScore = [int]$_.'Work score (1-10)'
    noise = $_.Noise
    sockets = $_.Sockets
    bestFor = @($_.'Best for' -split '; ')
    laptopTolerance = $_.'Laptop tolerance'
    recommendedDuration = $_.'Recommended working duration'
    bestTime = $_.'Best time to work'
    evidenceBasis = $_.'Evidence basis'
    confidence = $_.Confidence
    sources = @($_.'Source 1', $_.'Source 2')
    lastVerified = $_.'Last verified'
    googleQuery = ($_.Cafe + ', ' + $_.Address)
    source = 'csv'
  }
})

$destinationDirectory = Split-Path -Parent $DestinationJson
New-Item -ItemType Directory -Force -Path $destinationDirectory | Out-Null
$cafes | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $DestinationJson -Encoding utf8

Write-Output "Imported $($cafes.Count) cafe records to $DestinationJson"
