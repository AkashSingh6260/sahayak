const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-10">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-6">
        <div>
          <h3 className="text-white font-semibold mb-2">Sahayak</h3>
          <p className="text-sm">
            Connecting you with trusted local service professionals.
          </p>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-2">Quick Links</h4>
          <ul className="text-sm space-y-1">
            <li>Services</li>
            <li>My Requests</li>
            <li>Partner with us</li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-2">Support</h4>
          <p className="text-sm">support@sahayak.com</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
