import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/Login';
import { OverviewPage } from './pages/Overview';
import { ConnectivityPage } from './pages/Connectivity';
import { SMSPage } from './pages/SMS';
import { LTEProvider } from './lib/context/LTEContext';
import { useAuth } from './lib/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { TitleBar } from './components/TitleBar';

function App(): React.JSX.Element {
  const { auth, login } = useAuth();

  const content = () => {
    if (auth.isLoading) {
      return (
        <div className="h-full flex items-center justify-center bg-[#08080c]">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
        </div>
      );
    }

    if (!auth.isConnected) {
      return <LoginPage onLogin={login} error={auth.error} />;
    }

    return (
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/overview" replace />} />
            <Route path="/overview" element={<OverviewPage />} />
            <Route path="/connectivity" element={<ConnectivityPage />} />
            <Route path="/sms" element={<SMSPage />} />
          </Routes>
        </Layout>
      </Router>
    );
  };

  return (
    <LTEProvider enabled={auth.isConnected}>
      <div className="flex flex-col h-screen bg-[#08080c] overflow-hidden">
        <TitleBar />
        <div className="flex-1 overflow-hidden relative">
          {content()}
        </div>
      </div>
    </LTEProvider>
  );
}

export default App;
