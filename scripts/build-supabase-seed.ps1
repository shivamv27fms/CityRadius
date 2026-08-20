param(
  [Parameter(Mandatory = $true)]
  [string]$CafeJson,
  [Parameter(Mandatory = $true)]
  [string]$DestinationSql
)

function SqlString([object]$value) {
  if ($null -eq $value) { return 'null' }
  return "'" + ([string]$value).Replace("'", "''") + "'"
}

$cafes = @(Get-Content -Raw -LiteralPath $CafeJson | ConvertFrom-Json)
$lines = @(
  '-- Generated from data/delhi_ncr_cafe_data.csv by scripts/build-supabase-seed.ps1',
  '-- Safe to rerun after applying the CityRadius migration.',
  '',
  'insert into public.places (place_key, slug, name, category, city, area, address, source, status, metadata)',
  'values'
)

for ($i = 0; $i -lt $cafes.Count; $i++) {
  $cafe = $cafes[$i]
  $metadata = [ordered]@{
    costForTwo = $cafe.costForTwo
    foodScore = $cafe.foodScore
    mustOrder = $cafe.mustOrder
    foodNote = $cafe.foodNote
    wifi = $cafe.wifi
    workScore = $cafe.workScore
    noise = $cafe.noise
    sockets = $cafe.sockets
    bestFor = $cafe.bestFor
    laptopTolerance = $cafe.laptopTolerance
    recommendedDuration = $cafe.recommendedDuration
    bestTime = $cafe.bestTime
    evidenceBasis = $cafe.evidenceBasis
    confidence = $cafe.confidence
    sources = $cafe.sources
    lastVerified = $cafe.lastVerified
  } | ConvertTo-Json -Depth 6 -Compress

  $values = @(
    (SqlString ('seed_' + $cafe.id)),
    (SqlString $cafe.slug),
    (SqlString $cafe.name),
    "'cafe'",
    (SqlString $cafe.city),
    (SqlString $cafe.area),
    (SqlString $cafe.address),
    "'csv'",
    "'active'",
    ((SqlString $metadata) + '::jsonb')
  )
  $tuple = '  (' + ($values -join ', ') + ')'

  if ($i -lt ($cafes.Count - 1)) { $tuple += ',' }
  $lines += $tuple
}

$lines += @(
  '',
  'on conflict (place_key) do update set',
  '  slug = excluded.slug,',
  '  name = excluded.name,',
  '  city = excluded.city,',
  '  area = excluded.area,',
  '  address = excluded.address,',
  '  source = excluded.source,',
  '  status = excluded.status,',
  '  metadata = excluded.metadata,',
  '  updated_at = now();'
)

$lines | Set-Content -LiteralPath $DestinationSql -Encoding utf8
Write-Output "Generated seed SQL for $($cafes.Count) cafes at $DestinationSql"
