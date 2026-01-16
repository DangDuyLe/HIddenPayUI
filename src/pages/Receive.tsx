import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/context/WalletContext';
import { Copy, Share2, Settings } from 'lucide-react';
import { useState } from 'react';

const Receive = () => {
  const navigate = useNavigate();
  const { username, isConnected } = useWallet();
  const [copied, setCopied] = useState(false);

  if (!isConnected || !username) {
    navigate('/');
    return null;
  }

  // Generate PayPath QR data (static, based on username only)
  const qrData = `paypath:@${username}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`@${username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PayPath',
          text: `Send me SUI via PayPath: @${username}`,
          url: `https://paypath.app/@${username}`,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      handleCopy();
    }
  };

  // Generate a visual QR placeholder (will be replaced with real QR library)
  const QRCode = () => (
    <div className="w-56 h-56 bg-white p-4 rounded-2xl shadow-sm border border-border mx-auto">
      <div className="w-full h-full border-2 border-foreground rounded-lg flex items-center justify-center relative">
        {/* QR Pattern Placeholder */}
        <div className="grid grid-cols-7 gap-1 p-2">
          {Array.from({ length: 49 }).map((_, i) => {
            // Create a pattern based on username hash
            const hash = (username.charCodeAt(i % username.length) + i) % 3;
            return (
              <div
                key={i}
                className={`w-4 h-4 rounded-sm ${hash === 0 ? 'bg-foreground' : hash === 1 ? 'bg-foreground/60' : 'bg-transparent border border-border'
                  }`}
              />
            );
          })}
        </div>
        {/* Center Logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-lg font-black">P</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      <div className="page-wrapper">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 animate-fade-in">
          <h1 className="text-xl font-bold">Receive</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-muted-foreground text-sm font-medium hover:text-foreground transition-colors"
          >
            Done
          </button>
        </div>

        {/* QR Card - Identity Card Style */}
        <div className="flex-1 flex flex-col items-center justify-center animate-slide-up">
          <div className="card-container text-center max-w-sm w-full">
            {/* QR Code */}
            <QRCode />

            {/* Username */}
            <div className="mt-6">
              <p className="text-2xl font-bold">@{username}</p>
              <p className="text-muted-foreground text-sm mt-1">PayPath ID</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCopy}
                className="flex-1 py-3 px-4 bg-secondary rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-muted transition-colors"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleShare}
                className="flex-1 py-3 px-4 bg-secondary rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-muted transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>

          {/* Settings Link */}
          <button
            onClick={() => navigate('/settings')}
            className="mt-6 flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground transition-colors"
          >
            <Settings className="w-4 h-4" />
            Manage receiving preferences in Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default Receive;
