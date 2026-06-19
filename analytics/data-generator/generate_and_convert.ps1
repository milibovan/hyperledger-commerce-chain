node --max-old-space-size=8192 generate_data.mjs

Write-Host "`n========================================"
Write-Host "Converting to Parquet"
Write-Host "========================================"

$JsonlFiles = Get-ChildItem *.jsonl

foreach ($file in $JsonlFiles) {
    $ParamName = $file.Name
    $BaseName  = $file.BaseName
    $OutputFile = "$BaseName.parquet"

    Write-Host "Converting: $ParamName -> $OutputFile"

    python -c "import pandas as pd; pd.read_json(r'$ParamName', lines=True).to_parquet(r'$OutputFile', engine='pyarrow')"
}

Write-Host "`n========================================"
Write-Host "JSONL files size:"
Write-Host "========================================"
if ($JsonlFiles) {
    $JsonlFiles | Select-Object Name, @{Name="Size (GB)"; Expression={"{0:N4}" -f ($_.Length / 1GB)}} | Format-Table -AutoSize

    $TotalJsonlBytes = ($JsonlFiles | Measure-Object -Property Length -Sum).Sum
    $TotalJsonlGB = $TotalJsonlBytes / 1GB
    Write-Host ("--> GRAND TOTAL (JSONL): {0:N4} GB" -f $TotalJsonlGB) -ForegroundColor Cyan
} else {
    Write-Host "No JSONL files found."
}

Write-Host "`n========================================"
Write-Host "Parquet files size:"
Write-Host "========================================"
$ParquetFiles = Get-ChildItem *.parquet
if ($ParquetFiles) {
    $ParquetFiles | Select-Object Name, @{Name="Size (GB)"; Expression={"{0:N4}" -f ($_.Length / 1GB)}} | Format-Table -AutoSize

    $TotalParquetBytes = ($ParquetFiles | Measure-Object -Property Length -Sum).Sum
    $TotalParquetGB = $TotalParquetBytes / 1GB
    Write-Host ("--> GRAND TOTAL (PARQUET): {0:N4} GB" -f $TotalParquetGB) -ForegroundColor Green
} else {
    Write-Host "No Parquet files found."
}
Write-Host "========================================"