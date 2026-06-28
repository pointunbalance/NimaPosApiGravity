export const generateZatcaQR = (
    sellerName: string,
    vatNumber: string,
    timestamp: Date,
    invoiceTotal: number,
    vatTotal: number
): string => {
    const toHex = (str: string) => {
        let hex = '';
        for (let i = 0; i < str.length; i++) {
            hex += '' + str.charCodeAt(i).toString(16);
        }
        return hex;
    };

    const tlv = (tag: number, value: string) => {
        const textEncoder = new TextEncoder();
        const valueBytes = textEncoder.encode(value);
        
        const tagBuf = new Uint8Array([tag]);
        const lengthBuf = new Uint8Array([valueBytes.length]);
        
        const result = new Uint8Array(tagBuf.length + lengthBuf.length + valueBytes.length);
        result.set(tagBuf, 0);
        result.set(lengthBuf, tagBuf.length);
        result.set(valueBytes, tagBuf.length + lengthBuf.length);
        
        return result;
    };

    const tags = [
        tlv(1, sellerName || 'Seller'),
        tlv(2, vatNumber || '000000000000000'),
        tlv(3, timestamp.toISOString()),
        tlv(4, invoiceTotal.toString()),
        tlv(5, vatTotal.toString()),
    ];

    let totalLength = 0;
    for (const t of tags) totalLength += t.length;

    const finalArray = new Uint8Array(totalLength);
    let offset = 0;
    for (const t of tags) {
        finalArray.set(t, offset);
        offset += t.length;
    }

    // Convert to base64
    let binary = '';
    for (let i = 0; i < finalArray.byteLength; i++) {
        binary += String.fromCharCode(finalArray[i]);
    }
    return btoa(binary);
};
