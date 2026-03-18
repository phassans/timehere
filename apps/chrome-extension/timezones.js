(function () {
  const TZS = [
    // Americas
    { id: 'America/Los_Angeles', label: 'Pacific Time', abbr: 'PT', flag: '🇺🇸', region: 'Americas', country: 'United States' },
    { id: 'America/Denver', label: 'Mountain Time', abbr: 'MT', flag: '🇺🇸', region: 'Americas', country: 'United States' },
    { id: 'America/Chicago', label: 'Central Time', abbr: 'CT', flag: '🇺🇸', region: 'Americas', country: 'United States' },
    { id: 'America/New_York', label: 'Eastern Time', abbr: 'ET', flag: '🇺🇸', region: 'Americas', country: 'United States' },
    { id: 'America/Anchorage', label: 'Alaska Time', abbr: 'AKT', flag: '🇺🇸', region: 'Americas', country: 'United States' },
    { id: 'Pacific/Honolulu', label: 'Hawaii Time', abbr: 'HST', flag: '🇺🇸', region: 'Americas', country: 'United States' },
    { id: 'America/Toronto', label: 'Eastern Canada', abbr: 'ET', flag: '🇨🇦', region: 'Americas', country: 'Canada' },
    { id: 'America/Vancouver', label: 'Pacific Canada', abbr: 'PT', flag: '🇨🇦', region: 'Americas', country: 'Canada' },
    { id: 'America/Sao_Paulo', label: 'Brasilia Time', abbr: 'BRT', flag: '🇧🇷', region: 'Americas', country: 'Brazil' },
    { id: 'America/Argentina/Buenos_Aires', label: 'Argentina Time', abbr: 'ART', flag: '🇦🇷', region: 'Americas', country: 'Argentina' },
    { id: 'America/Mexico_City', label: 'Mexico Central', abbr: 'CST', flag: '🇲🇽', region: 'Americas', country: 'Mexico' },
    { id: 'America/Bogota', label: 'Colombia Time', abbr: 'COT', flag: '🇨🇴', region: 'Americas', country: 'Colombia' },
    { id: 'America/Lima', label: 'Peru Time', abbr: 'PET', flag: '🇵🇪', region: 'Americas', country: 'Peru' },
    { id: 'America/Santiago', label: 'Chile Time', abbr: 'CLT', flag: '🇨🇱', region: 'Americas', country: 'Chile' },
    { id: 'America/Caracas', label: 'Venezuela Time', abbr: 'VET', flag: '🇻🇪', region: 'Americas', country: 'Venezuela' },
    // Europe & Africa
    { id: 'Europe/London', label: 'Greenwich Mean Time', abbr: 'GMT', flag: '🇬🇧', region: 'Europe & Africa', country: 'United Kingdom' },
    { id: 'Europe/Dublin', label: 'Irish Standard Time', abbr: 'IST', flag: '🇮🇪', region: 'Europe & Africa', country: 'Ireland' },
    { id: 'Europe/Lisbon', label: 'Western European Time', abbr: 'WET', flag: '🇵🇹', region: 'Europe & Africa', country: 'Portugal' },
    { id: 'Europe/Paris', label: 'Central European Time', abbr: 'CET', flag: '🇫🇷', region: 'Europe & Africa', country: 'France' },
    { id: 'Europe/Berlin', label: 'Central European Time', abbr: 'CET', flag: '🇩🇪', region: 'Europe & Africa', country: 'Germany' },
    { id: 'Europe/Amsterdam', label: 'Central European Time', abbr: 'CET', flag: '🇳🇱', region: 'Europe & Africa', country: 'Netherlands' },
    { id: 'Europe/Madrid', label: 'Central European Time', abbr: 'CET', flag: '🇪🇸', region: 'Europe & Africa', country: 'Spain' },
    { id: 'Europe/Rome', label: 'Central European Time', abbr: 'CET', flag: '🇮🇹', region: 'Europe & Africa', country: 'Italy' },
    { id: 'Europe/Stockholm', label: 'Central European Time', abbr: 'CET', flag: '🇸🇪', region: 'Europe & Africa', country: 'Sweden' },
    { id: 'Europe/Zurich', label: 'Central European Time', abbr: 'CET', flag: '🇨🇭', region: 'Europe & Africa', country: 'Switzerland' },
    { id: 'Europe/Warsaw', label: 'Central European Time', abbr: 'CET', flag: '🇵🇱', region: 'Europe & Africa', country: 'Poland' },
    { id: 'Europe/Athens', label: 'Eastern European Time', abbr: 'EET', flag: '🇬🇷', region: 'Europe & Africa', country: 'Greece' },
    { id: 'Europe/Helsinki', label: 'Eastern European Time', abbr: 'EET', flag: '🇫🇮', region: 'Europe & Africa', country: 'Finland' },
    { id: 'Europe/Bucharest', label: 'Eastern European Time', abbr: 'EET', flag: '🇷🇴', region: 'Europe & Africa', country: 'Romania' },
    { id: 'Europe/Istanbul', label: 'Turkey Time', abbr: 'TRT', flag: '🇹🇷', region: 'Europe & Africa', country: 'Turkey' },
    { id: 'Europe/Moscow', label: 'Moscow Time', abbr: 'MSK', flag: '🇷🇺', region: 'Europe & Africa', country: 'Russia' },
    { id: 'Africa/Cairo', label: 'Eastern Africa', abbr: 'EET', flag: '🇪🇬', region: 'Europe & Africa', country: 'Egypt' },
    { id: 'Africa/Johannesburg', label: 'South Africa Time', abbr: 'SAST', flag: '🇿🇦', region: 'Europe & Africa', country: 'South Africa' },
    { id: 'Africa/Lagos', label: 'West Africa Time', abbr: 'WAT', flag: '🇳🇬', region: 'Europe & Africa', country: 'Nigeria' },
    { id: 'Africa/Nairobi', label: 'East Africa Time', abbr: 'EAT', flag: '🇰🇪', region: 'Europe & Africa', country: 'Kenya' },
    { id: 'Africa/Casablanca', label: 'Western European Time', abbr: 'WET', flag: '🇲🇦', region: 'Europe & Africa', country: 'Morocco' },
    // Middle East
    { id: 'Asia/Dubai', label: 'Gulf Standard Time', abbr: 'GST', flag: '🇦🇪', region: 'Middle East', country: 'United Arab Emirates' },
    { id: 'Asia/Riyadh', label: 'Arabia Standard Time', abbr: 'AST', flag: '🇸🇦', region: 'Middle East', country: 'Saudi Arabia' },
    { id: 'Asia/Kuwait', label: 'Arabia Standard Time', abbr: 'AST', flag: '🇰🇼', region: 'Middle East', country: 'Kuwait' },
    { id: 'Asia/Baghdad', label: 'Arabia Standard Time', abbr: 'AST', flag: '🇮🇶', region: 'Middle East', country: 'Iraq' },
    { id: 'Asia/Tehran', label: 'Iran Standard Time', abbr: 'IRST', flag: '🇮🇷', region: 'Middle East', country: 'Iran' },
    { id: 'Asia/Karachi', label: 'Pakistan Time', abbr: 'PKT', flag: '🇵🇰', region: 'Middle East', country: 'Pakistan' },
    // Asia & Pacific
    { id: 'Asia/Kolkata', label: 'India Standard Time', abbr: 'IST', flag: '🇮🇳', region: 'Asia & Pacific', country: 'India' },
    { id: 'Asia/Colombo', label: 'Sri Lanka Time', abbr: 'SLST', flag: '🇱🇰', region: 'Asia & Pacific', country: 'Sri Lanka' },
    { id: 'Asia/Dhaka', label: 'Bangladesh Time', abbr: 'BST', flag: '🇧🇩', region: 'Asia & Pacific', country: 'Bangladesh' },
    { id: 'Asia/Kathmandu', label: 'Nepal Time', abbr: 'NPT', flag: '🇳🇵', region: 'Asia & Pacific', country: 'Nepal' },
    { id: 'Asia/Almaty', label: 'Kazakhstan Time', abbr: 'ALMT', flag: '🇰🇿', region: 'Asia & Pacific', country: 'Kazakhstan' },
    { id: 'Asia/Tashkent', label: 'Uzbekistan Time', abbr: 'UZT', flag: '🇺🇿', region: 'Asia & Pacific', country: 'Uzbekistan' },
    { id: 'Asia/Bangkok', label: 'Indochina Time', abbr: 'ICT', flag: '🇹🇭', region: 'Asia & Pacific', country: 'Thailand' },
    { id: 'Asia/Ho_Chi_Minh', label: 'Indochina Time', abbr: 'ICT', flag: '🇻🇳', region: 'Asia & Pacific', country: 'Vietnam' },
    { id: 'Asia/Jakarta', label: 'Western Indonesia', abbr: 'WIB', flag: '🇮🇩', region: 'Asia & Pacific', country: 'Indonesia' },
    { id: 'Asia/Singapore', label: 'Singapore Time', abbr: 'SGT', flag: '🇸🇬', region: 'Asia & Pacific', country: 'Singapore' },
    { id: 'Asia/Kuala_Lumpur', label: 'Malaysia Time', abbr: 'MYT', flag: '🇲🇾', region: 'Asia & Pacific', country: 'Malaysia' },
    { id: 'Asia/Manila', label: 'Philippine Time', abbr: 'PHT', flag: '🇵🇭', region: 'Asia & Pacific', country: 'Philippines' },
    { id: 'Asia/Shanghai', label: 'China Standard Time', abbr: 'CST', flag: '🇨🇳', region: 'Asia & Pacific', country: 'China' },
    { id: 'Asia/Hong_Kong', label: 'Hong Kong Time', abbr: 'HKT', flag: '🇭🇰', region: 'Asia & Pacific', country: 'Hong Kong' },
    { id: 'Asia/Taipei', label: 'Taiwan Standard Time', abbr: 'TST', flag: '🇹🇼', region: 'Asia & Pacific', country: 'Taiwan' },
    { id: 'Asia/Seoul', label: 'Korea Standard Time', abbr: 'KST', flag: '🇰🇷', region: 'Asia & Pacific', country: 'South Korea' },
    { id: 'Asia/Tokyo', label: 'Japan Standard Time', abbr: 'JST', flag: '🇯🇵', region: 'Asia & Pacific', country: 'Japan' },
    { id: 'Australia/Perth', label: 'Australian Western', abbr: 'AWST', flag: '🇦🇺', region: 'Asia & Pacific', country: 'Australia' },
    { id: 'Australia/Darwin', label: 'Australian Central', abbr: 'ACST', flag: '🇦🇺', region: 'Asia & Pacific', country: 'Australia' },
    { id: 'Australia/Adelaide', label: 'Australian Central', abbr: 'ACST', flag: '🇦🇺', region: 'Asia & Pacific', country: 'Australia' },
    { id: 'Australia/Sydney', label: 'Australian Eastern', abbr: 'AEST', flag: '🇦🇺', region: 'Asia & Pacific', country: 'Australia' },
    { id: 'Australia/Melbourne', label: 'Australian Eastern', abbr: 'AEST', flag: '🇦🇺', region: 'Asia & Pacific', country: 'Australia' },
    { id: 'Australia/Brisbane', label: 'Australian Eastern', abbr: 'AEST', flag: '🇦🇺', region: 'Asia & Pacific', country: 'Australia' },
    { id: 'Pacific/Auckland', label: 'New Zealand Time', abbr: 'NZST', flag: '🇳🇿', region: 'Asia & Pacific', country: 'New Zealand' },
    { id: 'Pacific/Fiji', label: 'Fiji Time', abbr: 'FJT', flag: '🇫🇯', region: 'Asia & Pacific', country: 'Fiji' },
    { id: 'Pacific/Guam', label: 'Chamorro Time', abbr: 'ChST', flag: '🇬🇺', region: 'Asia & Pacific', country: 'Guam' },
    // UTC
    { id: 'UTC', label: 'Coordinated Universal', abbr: 'UTC', flag: '🌐', region: 'UTC', country: 'Global' }
  ];

  function getOffsetLabel(timeZone, date) {
    if (timeZone === 'UTC') return 'UTC+0';
    const now = date || new Date();
    const name = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' })
      .formatToParts(now).find(p => p.type === 'timeZoneName')?.value || 'GMT';
    return name.replace('GMT', 'UTC').replace('-', '−');
  }

  const TZS_WITH_OFFSET = TZS.map(t => ({ ...t, offset: getOffsetLabel(t.id) }));
  window.TIMEHERE_TIMEZONES = TZS_WITH_OFFSET;
  window.TIMEHERE_TZ_BY_ID = Object.fromEntries(TZS_WITH_OFFSET.map(t => [t.id, t]));
  window.TIMEHERE_OFFSET_LABEL = getOffsetLabel;
})();
