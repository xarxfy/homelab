export async function testProxmoxConnection(
    host: string,
    port: string,
    tokenId: string,
    tokenSecret: string
): Promise<{ success: boolean; error?: string }> {
    try {
        console.log('🧪 Testing connection to:', host);

        const response = await fetch('http://localhost:3001/api/proxmox/test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ host, port, tokenId, tokenSecret }),
        });

        console.log('📡 Response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Error:', errorData);
            return { success: false, error: errorData.error || 'Connection failed' };
        }

        const data = await response.json();
        console.log('✅ Backend response:', data);

        return { success: data.success === true };

    } catch (error: any) {
        console.error('❌ Test failed:', error);
        return { success: false, error: error.message };
    }
}