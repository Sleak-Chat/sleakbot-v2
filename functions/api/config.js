const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Max-Age': '86400'
};

export async function onRequestOptions() {
    return new Response(null, {
        status: 200,
        headers: corsHeaders
    });
}

export async function onRequestGet(context) {
    const { searchParams } = new URL(context.request.url);
    const chatbotId = searchParams.get('id');
    // Accept both chat_id and visitor_id for backward compatibility
    const chatId = searchParams.get('chat_id') || searchParams.get('visitor_id');

    if (!chatbotId || !chatId) {
        return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    try {
        const response = await fetch(`${context.env.DB_URL}/rest/v1/rpc/get_chatbot_config`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                apikey: context.env.DB_PUBLIC_KEY
            },
            body: JSON.stringify({
                chatbotid: chatbotId,
                chatid: chatId
            })
        });

        const data = await response.json();

        return new Response(
            JSON.stringify({
                data: {
                    chatbot_config: data.chatbot_config,
                    chat_exists: data.chat_exists
                }
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch config', details: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}