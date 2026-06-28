export const hashPin = async (pin: string): Promise<string> => {
    // If it's already a hash (length 64), don't re-hash it
    if (pin.length === 64) return pin;
    
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
};
