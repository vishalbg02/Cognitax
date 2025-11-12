import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Upload, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3,
  MessageSquare,
  LogOut,
  Loader2,
  Send,
  ArrowUpRight,
  ArrowDownRight,
  Wallet
} from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from './ui/textarea';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [sessionId] = useState(`session_${Date.now()}`);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [userRes, analyticsRes, transactionsRes, uploadsRes] = await Promise.all([
        axios.get(`${API}/auth/me`),
        axios.get(`${API}/analytics`),
        axios.get(`${API}/transactions`),
        axios.get(`${API}/uploads`)
      ]);

      setUser(userRes.data);
      setAnalytics(analyticsRes.data);
      setTransactions(transactionsRes.data);
      setUploads(uploadsRes.data);
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please upload a PDF file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API}/upload-pdf`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(`Successfully processed ${response.data.transactions_count} transactions!`);
      await loadData();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const handleChat = async () => {
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', message: userMsg }]);
    setChatLoading(true);

    try {
      const response = await axios.post(
        `${API}/chat`,
        { message: userMsg, session_id: sessionId }
      );

      setChatHistory(prev => [...prev, { role: 'assistant', message: response.data.response }]);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get response');
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50" data-testid="dashboard">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              TaxAI Pro
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <img 
                src={user?.picture || 'https://via.placeholder.com/40'} 
                alt={user?.name}
                className="w-10 h-10 rounded-full border-2 border-sky-200"
              />
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
            </div>
            <Button 
              onClick={handleLogout}
              data-testid="logout-btn"
              variant="ghost"
              size="icon"
              className="text-slate-600 hover:text-slate-900"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* KPI Cards */}
        {analytics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KPICard
              title="Total Income"
              value={`₹${analytics.total_income.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
              trend="+12.5%"
              trendUp={true}
              bgColor="from-emerald-50 to-emerald-100"
            />
            <KPICard
              title="Total Expenses"
              value={`₹${analytics.total_expenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon={<TrendingDown className="w-6 h-6 text-rose-600" />}
              trend="-5.3%"
              trendUp={false}
              bgColor="from-rose-50 to-rose-100"
            />
            <KPICard
              title="Net Cash Flow"
              value={`₹${analytics.net_cash_flow.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon={<Wallet className="w-6 h-6 text-sky-600" />}
              trend="+8.2%"
              trendUp={true}
              bgColor="from-sky-50 to-sky-100"
            />
            <KPICard
              title="Tax Due"
              value={analytics.latest_tax ? `₹${(analytics.latest_tax.gst_amount + analytics.latest_tax.itr_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₹0.00'}
              icon={<DollarSign className="w-6 h-6 text-purple-600" />}
              bgColor="from-purple-50 to-purple-100"
            />
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white border border-slate-200 p-1 rounded-xl">
            <TabsTrigger value="overview" data-testid="tab-overview" className="rounded-lg">Overview</TabsTrigger>
            <TabsTrigger value="transactions" data-testid="tab-transactions" className="rounded-lg">Transactions</TabsTrigger>
            <TabsTrigger value="tax" data-testid="tab-tax" className="rounded-lg">Tax Analysis</TabsTrigger>
            <TabsTrigger value="chat" data-testid="tab-chat" className="rounded-lg">AI Assistant</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Upload Bank Statement</CardTitle>
                <CardDescription>Upload your PDF bank statement to analyze transactions and calculate taxes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <Upload className="w-16 h-16 text-slate-400 mb-4" />
                  <p className="text-slate-600 mb-4 font-medium">Drag and drop or click to upload</p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    data-testid="file-upload-input"
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button 
                      disabled={uploading}
                      data-testid="upload-btn"
                      className="bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 text-white"
                      asChild
                    >
                      <span className="cursor-pointer">
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Select PDF File'
                        )}
                      </span>
                    </Button>
                  </label>
                </div>
              </CardContent>
            </Card>

            {uploads.length > 0 && (
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-2xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Recent Uploads</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {uploads.slice(0, 5).map((upload) => (
                      <div key={upload.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-sky-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{upload.filename}</p>
                            <p className="text-sm text-slate-500">
                              {upload.bank_name || 'Processing...'} • {new Date(upload.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          upload.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          upload.status === 'failed' ? 'bg-rose-100 text-rose-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {upload.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>All Transactions</CardTitle>
                <CardDescription>{transactions.length} transactions found</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {transactions.slice(0, 50).map((txn) => (
                    <div key={txn.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          txn.transaction_type === 'credit' ? 'bg-emerald-100' : 'bg-rose-100'
                        }`}>
                          {txn.transaction_type === 'credit' ? (
                            <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <ArrowDownRight className="w-5 h-5 text-rose-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{txn.description}</p>
                          <p className="text-sm text-slate-500">
                            {txn.category} • {txn.mode} • {txn.date}
                          </p>
                        </div>
                      </div>
                      <p className={`font-bold ${
                        txn.transaction_type === 'credit' ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {txn.transaction_type === 'credit' ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tax Analysis Tab */}
          <TabsContent value="tax">
            {analytics?.latest_tax ? (
              <div className="space-y-6">
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-2xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Tax Calculation Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <TaxCard title="GST" amount={analytics.latest_tax.gst_amount} color="text-sky-600" />
                      <TaxCard title="ITR" amount={analytics.latest_tax.itr_amount} color="text-emerald-600" />
                      <TaxCard title="TDS" amount={analytics.latest_tax.tds_amount} color="text-purple-600" />
                      <TaxCard title="Estimated Turnover" amount={analytics.latest_tax.estimated_turnover} color="text-orange-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-2xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Tax Optimization Tips</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.latest_tax.tax_optimization_tips.map((tip, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-4 bg-sky-50 rounded-lg">
                          <div className="w-6 h-6 bg-sky-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-sky-700">{idx + 1}</span>
                          </div>
                          <p className="text-slate-700">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="py-12 text-center">
                  <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">Upload a bank statement to see tax analysis</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>AI Tax Assistant</CardTitle>
                <CardDescription>Ask me anything about Indian taxes, GST, ITR, or your financial data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-96 overflow-y-auto space-y-4 p-4 bg-slate-50 rounded-lg">
                    {chatHistory.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <MessageSquare className="w-16 h-16 text-slate-300 mb-4" />
                        <p className="text-slate-600">Start a conversation with your AI tax assistant</p>
                      </div>
                    ) : (
                      chatHistory.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-4 rounded-2xl ${
                            msg.role === 'user' 
                              ? 'bg-gradient-to-r from-sky-600 to-emerald-600 text-white' 
                              : 'bg-white border border-slate-200 text-slate-900'
                          }`}>
                            <p className="whitespace-pre-wrap">{msg.message}</p>
                          </div>
                        </div>
                      ))
                    )}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 p-4 rounded-2xl">
                          <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Textarea
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleChat();
                        }
                      }}
                      placeholder="Ask about GST, ITR, TDS, or your transactions..."
                      data-testid="chat-input"
                      className="min-h-[60px] resize-none"
                      disabled={chatLoading}
                    />
                    <Button
                      onClick={handleChat}
                      disabled={!chatMessage.trim() || chatLoading}
                      data-testid="chat-send-btn"
                      className="bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 text-white h-[60px] px-6"
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, icon, trend, trendUp, bgColor }) => {
  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 bg-gradient-to-br ${bgColor} rounded-xl flex items-center justify-center`}>
            {icon}
          </div>
          {trend && (
            <span className={`text-sm font-semibold ${
              trendUp ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {trend}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{value}</p>
      </CardContent>
    </Card>
  );
};

const TaxCard = ({ title, amount, color }) => {
  return (
    <div className="p-6 bg-slate-50 rounded-xl">
      <p className="text-sm text-slate-600 mb-2">{title}</p>
      <p className={`text-3xl font-bold ${color}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  );
};

export default Dashboard;