export default function PrivacyPolicy() {
  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '40px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      lineHeight: 1.6,
      color: '#333'
    }}>
      <h1 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        Gizlilik Politikası / Privacy Policy
      </h1>

      <p style={{ color: '#666', fontSize: '14px' }}>
        Son güncelleme / Last updated: {new Date().toLocaleDateString('tr-TR')}
      </p>

      <h2>Türkçe</h2>

      <h3>Toplanan Veriler</h3>
      <p>
        Sahibinden Instagram Generator eklentisi, yalnızca kullanıcının aktif olarak
        görüntülediği sahibinden.com ilan sayfasından aşağıdaki verileri toplar:
      </p>
      <ul>
        <li>İlan başlığı, fiyatı ve konumu</li>
        <li>İlan görselleri</li>
        <li>Emlak danışmanı adı, telefonu ve logosu</li>
      </ul>

      <h3>Verilerin Kullanımı</h3>
      <p>
        Toplanan veriler yalnızca Instagram gönderi ve hikaye görselleri oluşturmak için kullanılır.
        Veriler sunucuda geçici olarak işlenir ve görsel/video oluşturulduktan sonra
        <strong> otomatik olarak silinir</strong>.
      </p>

      <h3>Veri Saklama</h3>
      <p>
        <strong>Hiçbir veri kalıcı olarak saklanmaz.</strong> Sunucumuz verileri yalnızca
        görsel oluşturma süresince (genellikle 1-2 dakika) geçici olarak tutar.
      </p>

      <h3>Üçüncü Taraflarla Paylaşım</h3>
      <p>
        Verileriniz hiçbir üçüncü tarafla paylaşılmaz. Analitik veya izleme araçları kullanılmamaktadır.
      </p>

      <hr style={{ margin: '40px 0', border: 'none', borderTop: '1px solid #eee' }} />

      <h2>English</h2>

      <h3>Data Collection</h3>
      <p>
        The Sahibinden Instagram Generator extension collects the following data only from
        the sahibinden.com listing page that the user is actively viewing:
      </p>
      <ul>
        <li>Listing title, price, and location</li>
        <li>Listing images</li>
        <li>Real estate agent name, phone, and logo</li>
      </ul>

      <h3>Data Usage</h3>
      <p>
        Collected data is used solely to generate Instagram post and story visuals.
        Data is temporarily processed on our server and <strong>automatically deleted</strong> after
        the image/video is generated.
      </p>

      <h3>Data Retention</h3>
      <p>
        <strong>No data is permanently stored.</strong> Our server only holds data temporarily
        during the visual generation process (typically 1-2 minutes).
      </p>

      <h3>Third-Party Sharing</h3>
      <p>
        Your data is not shared with any third parties. No analytics or tracking tools are used.
      </p>

      <hr style={{ margin: '40px 0', border: 'none', borderTop: '1px solid #eee' }} />

      <h3>İletişim / Contact</h3>
      <p>
        Sorularınız için / For questions:<br />
        <a href="mailto:yusuf@yesilyurt.dev" style={{ color: '#0066cc' }}>yusuf@yesilyurt.dev</a>
      </p>
    </div>
  );
}
