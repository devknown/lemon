export const LTE_BANDS = [
    { id: '1', name: 'B1 (2100)', value: '1' },
    { id: '3', name: 'B3 (1800)', value: '4' },
    { id: '7', name: 'B7 (2600)', value: '40' },
    { id: '8', name: 'B8 (900)', value: '80' },
    { id: '20', name: 'B20 (800)', value: '80000' },
    { id: '28', name: 'B28 (700)', value: '8000000' },
    { id: '38', name: 'B38 (TDD)', value: '2000000000' },
    { id: '40', name: 'B40 (TDD)', value: '8000000000' },
];

export const getBandName = (bandId: any) => {
    if (!bandId) return 'N/A';
    const str = String(bandId);

    // Handle multiple bands (Carrier Aggregation)
    if (str.includes(',') || str.includes('+')) {
        return str
            .split(/[,\+]/)
            .map((b) => getBandName(b.trim()))
            .join(' + ');
    }

    // Extract the main band number or value (e.g., "3" from "3 (1800)" or "B3", or "4" for hex)
    const match = str.match(/B?(\d+)/);
    const id = match ? match[1] : str;

    const band = LTE_BANDS.find((b) => b.id === id || b.value === id);
    if (band) return band.name;

    // Fallback: ensure it looks like a band (B3 instead of 3)
    // Avoid double B if it already has it
    return str.startsWith('B') ? str : (isNaN(Number(str)) ? str : `B${str}`);
};

export const getNetworkTypeName = (mode: string) => {
    switch (mode) {
        case '03': return '4G';
        case '02': return '3G';
        case '01': return '2G';
        case '00': return 'Auto';
        default: return mode || '';
    }
};
