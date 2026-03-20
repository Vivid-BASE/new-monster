export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS headers for local development if needed, 
  // but for Pages Functions on the same domain, it's not strictly required.
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 環境変数の存在確認
  if (!env.RESEND_API_KEY) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Cloudflareの環境変数に「RESEND_API_KEY」が設定されていません。管理画面の設定を確認してください。' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!env.NOTIFICATION_EMAIL) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Cloudflareの環境変数に「NOTIFICATION_EMAIL」が設定されていません。' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const formData = await request.formData();
    const name = formData.get('name');
    const dob = formData.get('dob');
    const age = formData.get('age');
    const email = formData.get('email');
    const address = formData.get('address');
    const favorite_artists = formData.get('favorite_artists');
    const profile = formData.get('profile');
    const media_url = formData.get('media_url') || 'N/A';
    
    const vocalFiles = formData.getAll('vocal_files');
    const photoFiles = formData.getAll('photo_files');
    
    const attachments = [];

    const processFiles = async (files) => {
      for (const file of files) {
        if (file instanceof File && file.size > 0) {
          const arrayBuffer = await file.arrayBuffer();
          const base64Content = btoa(
            new Uint8Array(arrayBuffer)
              .reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          
          attachments.push({
            filename: file.name,
            content: base64Content,
          });
        }
      }
    };

    await processFiles(vocalFiles);
    await processFiles(photoFiles);

    const mailSubject = `【VGP応募】${name}様 よりオーディション応募がありました`;

    // Resend API call
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'VGP Audition Form <onboarding@resend.dev>',
        to: [env.NOTIFICATION_EMAIL],
        subject: mailSubject,
        html: `
          <h2>VOCAL GENESIS PROJECT 応募内容</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>氏名</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${name}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>生年月日</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${dob}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>年齢</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${age} 歳</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>メール</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${email}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>住所</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${address}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>好きなアーティスト</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${favorite_artists}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>音源・動画URL</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${media_url}</td></tr>
          </table>
          <h3>プロフィール</h3>
          <p style="white-space: pre-wrap;">${profile}</p>
          <p>※音源添付: ${vocalFiles.filter(f => f.size > 0).length}件 / 写真添付: ${photoFiles.filter(f => f.size > 0).length}件</p>
        `,
        attachments: attachments
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      throw new Error(`Resend API Error: ${errorText}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
