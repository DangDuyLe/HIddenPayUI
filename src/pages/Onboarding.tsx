import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/context/WalletContext';

const Onboarding = () => {
  const navigate = useNavigate();
  const { setUsername, isConnected, username: existingUsername } = useWallet();
  const [inputUsername, setInputUsername] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  if (!isConnected) {
    navigate('/');
    return null;
  }

  if (existingUsername) {
    navigate('/dashboard');
    return null;
  }

  const handleSubmit = () => {
    const clean = inputUsername.replace('@', '').trim().toLowerCase();

    if (clean.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (!/^[a-z0-9_]+$/.test(clean)) {
      setError('Only letters, numbers, and underscores allowed');
      return;
    }

    setIsChecking(true);

    // Simulate check
    setTimeout(() => {
      setUsername(clean);
      navigate('/dashboard');
    }, 500);
  };

  return (
    <div className="app-container">
      <div className="page-wrapper justify-between">
        {/* Top */}
        <div className="pt-16 animate-fade-in">
          <p className="label-caps mb-4">Almost there</p>
          <h1 className="display-medium">Choose your<br />username</h1>
        </div>

        {/* Middle */}
        <div className="py-8 animate-slide-up w-full max-w-full overflow-hidden">
          <div className="flex items-center w-full min-w-0">
            <span className="text-2xl font-bold mr-2 flex-shrink-0">@</span>
            <input
              type="text"
              value={inputUsername}
              onChange={(e) => {
                setInputUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="username"
              className="flex-1 min-w-0 w-full py-4 bg-transparent text-2xl font-bold placeholder:text-muted-foreground focus:outline-none border-b-2 border-border focus:border-foreground transition-colors"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-destructive mt-4">{error}</p>
          )}

          <p className="text-muted-foreground mt-4">
            This is how people will find and pay you
          </p>
        </div>

        {/* Bottom */}
        <div className="pb-8 animate-slide-up stagger-1">
          <button
            onClick={handleSubmit}
            disabled={!inputUsername || isChecking}
            className="btn-primary"
          >
            {isChecking ? 'Creating...' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
