/**
 * Cognitax - Smart Tax Management Platform
 * 
 * Author: Vishal
 * Description: Professional tax management dashboard with AI-powered insights
 */

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
  Wallet,
  Download,
  PieChart,
  LineChart,
  Filter,
  Search,
  Calendar,
  TrendingUpIcon,
  X,
  Moon,
  Sun,
  Trash2,
  FileCheck,
  Newspaper
} from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { 
  LineChart as RechartsLine, 
  Line, 
  BarChart as RechartsBar, 
  Bar, 
  PieChart as RechartsPie, 
  Pie, 
  Cell,
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useTheme } from '../context/ThemeContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Professional color palette - solid colors for corporate look
const COLORS = ['#1e40af', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777', '#0891b2', '#65a30d'];

const Dashboard = () => {
  const { isDarkMode, toggleTheme } = useTheme();
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  
  // New state for multi-file upload
  const [pendingFiles, setPendingFiles] = useState([]);
  
  // New state for date range and amount filters
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });
  
  // New state for bulk operations
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  
  // Tax news state
  const [taxNews, setTaxNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);

  useEffect(() => {
    loadData();
    loadTaxNews();
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

  // Load Indian tax news
  const loadTaxNews = async () => {
    setNewsLoading(true);
    try {
      const newsItems = [
        {
          title: "Income Tax Department Updates Filing Portal",
          description: "The Income Tax Department has introduced new features in the e-filing portal to simplify tax return filing for FY 2024-25.",
          date: "2025-01-15",
          source: "Income Tax India",
          link: "https://www.incometax.gov.in"
        },
        {
          title: "GST Council Announces Rate Changes",
          description: "The GST Council has revised rates for certain goods and services effective from April 2025.",
          date: "2025-01-10",
          source: "GST Portal",
          link: "https://www.gst.gov.in"
        },
        {
          title: "New TDS Rules for FY 2024-25",
          description: "CBDT issues circular on updated TDS rates and provisions applicable from April 1, 2024.",
          date: "2025-01-05",
          source: "CBDT",
          link: "https://www.incometax.gov.in"
        },
        {
          title: "ITR Filing Deadline Extended",
          description: "The last date for filing Income Tax Returns for AY 2024-25 has been extended to July 31, 2025.",
          date: "2024-12-28",
          source: "Income Tax India",
          link: "https://www.incometax.gov.in"
        },
        {
          title: "Budget 2025: Key Tax Proposals",
          description: "Finance Minister announces major tax reforms including changes to income tax slabs and exemptions.",
          date: "2024-12-20",
          source: "Ministry of Finance",
          link: "https://www.finmin.gov.in"
        }
      ];
      setTaxNews(newsItems);
    } catch (error) {
      console.error('Failed to load tax news:', error);
    } finally {
      setNewsLoading(false);
    }
  };

  // Handle multiple file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const pdfFiles = files.filter(file => file.name.toLowerCase().endsWith('.pdf'));
    
    if (pdfFiles.length === 0) {
      toast.error('Please select PDF files only');
      return;
    }

    const newFiles = pdfFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB'
    }));

    setPendingFiles(prev => [...prev, ...newFiles]);
    toast.success(`${pdfFiles.length} file(s) added`);
  };

  // Remove a pending file
  const removePendingFile = (id) => {
    setPendingFiles(prev => prev.filter(f => f.id !== id));
    toast.info('File removed');
  };

  // Upload all pending files
  const handleUploadAll = async () => {
    if (pendingFiles.length === 0) {
      toast.error('No files to upload');
      return;
    }

    setUploading(true);
    let successCount = 0;
    let failCount = 0;

    for (const fileItem of pendingFiles) {
      try {
        const formData = new FormData();
        formData.append('file', fileItem.file);

        await axios.post(`${API}/upload-pdf`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        successCount++;
      } catch (error) {
        console.error(`Upload error for ${fileItem.name}:`, error);
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} file(s)`);
      setPendingFiles([]);
      await loadData();
    }
    
    if (failCount > 0) {
      toast.error(`Failed to upload ${failCount} file(s)`);
    }
    
    setUploading(false);
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
    // Clear all session data
    setPendingFiles([]);
    setSelectedTransactions([]);
    setChatHistory([]);
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

  // Generate PDF Report
  const generatePDFReport = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(24);
    doc.setTextColor(14, 165, 233);
    doc.text('Cognitax', 14, 20);
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Financial Report', 14, 30);
    
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 38);
    doc.text(`User: ${user?.name}`, 14, 44);
    
    // Summary Section
    doc.setFontSize(14);
    doc.text('Financial Summary', 14, 55);
    doc.setFontSize(10);
    
    if (analytics) {
      doc.text(`Total Income: ₹${analytics.total_income.toLocaleString('en-IN')}`, 14, 65);
      doc.text(`Total Expenses: ₹${analytics.total_expenses.toLocaleString('en-IN')}`, 14, 72);
      doc.text(`Net Cash Flow: ₹${analytics.net_cash_flow.toLocaleString('en-IN')}`, 14, 79);
      doc.text(`Total Transactions: ${analytics.transactions_count}`, 14, 86);
    }
    
    // Tax Summary
    if (analytics?.latest_tax) {
      doc.setFontSize(14);
      doc.text('Tax Summary', 14, 100);
      doc.setFontSize(10);
      doc.text(`GST: ₹${analytics.latest_tax.gst_amount.toLocaleString('en-IN')}`, 14, 110);
      doc.text(`ITR: ₹${analytics.latest_tax.itr_amount.toLocaleString('en-IN')}`, 14, 117);
      doc.text(`TDS: ₹${analytics.latest_tax.tds_amount.toLocaleString('en-IN')}`, 14, 124);
      doc.text(`Estimated Turnover: ₹${analytics.latest_tax.estimated_turnover.toLocaleString('en-IN')}`, 14, 131);
    }
    
    // Transactions Table
    if (transactions.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Recent Transactions', 14, 20);
      
      const tableData = transactions.slice(0, 50).map(txn => [
        txn.date,
        txn.description.substring(0, 30),
        txn.category,
        txn.transaction_type,
        `₹${txn.amount.toLocaleString('en-IN')}`
      ]);
      
      autoTable(doc, {
        head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
        body: tableData,
        startY: 30,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [14, 165, 233] }
      });
    }
    
    doc.save(`Cognitax_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF report downloaded successfully!');
  };

  // Generate Excel Report
  const generateExcelReport = () => {
    const wb = XLSX.utils.book_new();
    
    // Summary Sheet
    const summaryData = [
      ['Cognitax Financial Report'],
      ['Generated', new Date().toLocaleDateString()],
      ['User', user?.name],
      [],
      ['Financial Summary'],
      ['Total Income', analytics?.total_income || 0],
      ['Total Expenses', analytics?.total_expenses || 0],
      ['Net Cash Flow', analytics?.net_cash_flow || 0],
      ['Total Transactions', analytics?.transactions_count || 0],
      [],
      ['Tax Summary'],
      ['GST', analytics?.latest_tax?.gst_amount || 0],
      ['ITR', analytics?.latest_tax?.itr_amount || 0],
      ['TDS', analytics?.latest_tax?.tds_amount || 0],
      ['Estimated Turnover', analytics?.latest_tax?.estimated_turnover || 0]
    ];
    
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
    
    // Transactions Sheet
    if (transactions.length > 0) {
      const txnData = transactions.map(txn => ({
        Date: txn.date,
        Description: txn.description,
        Category: txn.category,
        Type: txn.transaction_type,
        Amount: txn.amount,
        Mode: txn.mode
      }));
      
      const txnWs = XLSX.utils.json_to_sheet(txnData);
      XLSX.utils.book_append_sheet(wb, txnWs, 'Transactions');
    }
    
    // Category Breakdown Sheet
    if (analytics?.category_breakdown) {
      const catData = Object.entries(analytics.category_breakdown).map(([category, amount]) => ({
        Category: category,
        Amount: amount
      }));
      
      const catWs = XLSX.utils.json_to_sheet(catData);
      XLSX.utils.book_append_sheet(wb, catWs, 'Category Breakdown');
    }
    
    XLSX.writeFile(wb, `Cognitax_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel report downloaded successfully!');
  };

  // Generate CSV Report
  const generateCSVReport = () => {
    const csvData = transactions.map(txn => ({
      Date: txn.date,
      Description: txn.description,
      Category: txn.category,
      Type: txn.transaction_type,
      Amount: txn.amount,
      Mode: txn.mode
    }));
    
    const ws = XLSX.utils.json_to_sheet(csvData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cognitax_Transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast.success('CSV report downloaded successfully!');
  };

  // Prepare chart data
  const getCategoryChartData = () => {
    if (!analytics?.category_breakdown) return [];
    return Object.entries(analytics.category_breakdown).map(([name, value]) => ({
      name,
      value: parseFloat(value)
    }));
  };

  const getModeChartData = () => {
    if (!analytics?.mode_breakdown) return [];
    return Object.entries(analytics.mode_breakdown).map(([name, value]) => ({
      name,
      value: parseFloat(value)
    }));
  };

  const getMonthlyTrendData = () => {
    if (!transactions.length) return [];
    
    const monthlyData = {};
    transactions.forEach(txn => {
      const date = new Date(txn.date.split('/').reverse().join('-'));
      if (isNaN(date.getTime())) return;
      
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, income: 0, expenses: 0 };
      }
      
      if (txn.transaction_type === 'credit') {
        monthlyData[monthKey].income += txn.amount;
      } else {
        monthlyData[monthKey].expenses += txn.amount;
      }
    });
    
    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  };

  // Advanced filtering with date and amount range
  const getFilteredTransactions = () => {
    return transactions.filter(txn => {
      // Search filter
      const matchesSearch = txn.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            txn.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Category filter
      const matchesCategory = filterCategory === 'all' || txn.category === filterCategory;
      
      // Date range filter
      let matchesDateRange = true;
      if (dateRange.start || dateRange.end) {
        const txnDate = new Date(txn.date.split('/').reverse().join('-'));
        if (dateRange.start && txnDate < new Date(dateRange.start)) {
          matchesDateRange = false;
        }
        if (dateRange.end && txnDate > new Date(dateRange.end)) {
          matchesDateRange = false;
        }
      }
      
      // Amount range filter
      let matchesAmountRange = true;
      if (amountRange.min && txn.amount < parseFloat(amountRange.min)) {
        matchesAmountRange = false;
      }
      if (amountRange.max && txn.amount > parseFloat(amountRange.max)) {
        matchesAmountRange = false;
      }
      
      return matchesSearch && matchesCategory && matchesDateRange && matchesAmountRange;
    });
  };

  const filteredTransactions = getFilteredTransactions();

  // Bulk delete selected transactions
  const handleBulkDelete = async () => {
    if (selectedTransactions.length === 0) {
      toast.error('No transactions selected');
      return;
    }

    if (!window.confirm(`Delete ${selectedTransactions.length} transaction(s)?`)) {
      return;
    }

    try {
      await Promise.all(
        selectedTransactions.map(id => 
          axios.delete(`${API}/transactions/${id}`)
        )
      );
      
      toast.success(`Deleted ${selectedTransactions.length} transaction(s)`);
      setSelectedTransactions([]);
      await loadData();
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete transactions');
    }
  };

  // Toggle transaction selection
  const toggleTransactionSelection = (txnId) => {
    setSelectedTransactions(prev => 
      prev.includes(txnId) 
        ? prev.filter(id => id !== txnId)
        : [...prev, txnId]
    );
  };

  // Select all filtered transactions
  const selectAllTransactions = () => {
    if (selectedTransactions.length === filteredTransactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(filteredTransactions.map(t => t.id));
    }
  };

  const categories = ['all', ...new Set(transactions.map(t => t.category))];

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-slate-50'}`}>
        <Loader2 className="w-12 h-12 animate-spin text-blue-700" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-slate-50'}`} data-testid="dashboard">
      {/* Header */}
      <header className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'} border-b sticky top-0 z-50 shadow-sm`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-700 rounded-lg flex items-center justify-center shadow-sm">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-900'}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Cognitax
              </span>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>Smart Tax Management</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              onClick={toggleTheme}
              variant="ghost"
              size="icon"
              className={`${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <div className="flex items-center gap-3">
              <img 
                src={user?.picture || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.name || 'User')} 
                alt={user?.name}
                className="w-10 h-10 rounded-full border-2 border-blue-200 shadow-sm"
              />
              <div className="hidden sm:block">
                <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{user?.name}</p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>{user?.email}</p>
              </div>
            </div>
            <Button 
              onClick={handleLogout}
              data-testid="logout-btn"
              variant="ghost"
              size="icon"
              className={`${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
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
              icon={<TrendingUp className="w-6 h-6 text-white" />}
              trend="+12.5%"
              trendUp={true}
              bgColor="bg-emerald-600"
              isDarkMode={isDarkMode}
            />
            <KPICard
              title="Total Expenses"
              value={`₹${analytics.total_expenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon={<TrendingDown className="w-6 h-6 text-white" />}
              trend="-5.3%"
              trendUp={false}
              bgColor="bg-rose-600"
              isDarkMode={isDarkMode}
            />
            <KPICard
              title="Net Cash Flow"
              value={`₹${analytics.net_cash_flow.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon={<Wallet className="w-6 h-6 text-white" />}
              trend="+8.2%"
              trendUp={true}
              bgColor="bg-blue-700"
              isDarkMode={isDarkMode}
            />
            <KPICard
              title="Tax Due"
              value={analytics.latest_tax ? `₹${(analytics.latest_tax.gst_amount + analytics.latest_tax.itr_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₹0.00'}
              icon={<DollarSign className="w-6 h-6 text-white" />}
              bgColor="bg-purple-700"
              isDarkMode={isDarkMode}
            />
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'} border p-1 rounded-lg shadow-sm`}>
            <TabsTrigger value="overview" data-testid="tab-overview" className={`rounded-md ${isDarkMode ? 'data-[state=active]:bg-blue-600 data-[state=active]:text-white' : 'data-[state=active]:bg-blue-700 data-[state=active]:text-white'}`}>
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics" className={`rounded-md ${isDarkMode ? 'data-[state=active]:bg-blue-600 data-[state=active]:text-white' : 'data-[state=active]:bg-blue-700 data-[state=active]:text-white'}`}>
              Analytics
            </TabsTrigger>
            <TabsTrigger value="transactions" data-testid="tab-transactions" className={`rounded-md ${isDarkMode ? 'data-[state=active]:bg-blue-600 data-[state=active]:text-white' : 'data-[state=active]:bg-blue-700 data-[state=active]:text-white'}`}>
              Transactions
            </TabsTrigger>
            <TabsTrigger value="tax" data-testid="tab-tax" className={`rounded-md ${isDarkMode ? 'data-[state=active]:bg-blue-600 data-[state=active]:text-white' : 'data-[state=active]:bg-blue-700 data-[state=active]:text-white'}`}>
              Tax Analysis
            </TabsTrigger>
            <TabsTrigger value="reports" data-testid="tab-reports" className={`rounded-md ${isDarkMode ? 'data-[state=active]:bg-blue-600 data-[state=active]:text-white' : 'data-[state=active]:bg-blue-700 data-[state=active]:text-white'}`}>
              Reports
            </TabsTrigger>
            <TabsTrigger value="news" data-testid="tab-news" className={`rounded-md ${isDarkMode ? 'data-[state=active]:bg-blue-600 data-[state=active]:text-white' : 'data-[state=active]:bg-blue-700 data-[state=active]:text-white'}`}>
              Tax News
            </TabsTrigger>
            <TabsTrigger value="chat" data-testid="tab-chat" className={`rounded-md ${isDarkMode ? 'data-[state=active]:bg-blue-600 data-[state=active]:text-white' : 'data-[state=active]:bg-blue-700 data-[state=active]:text-white'}`}>
              AI Assistant
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab - Multi-file Upload */}
          <TabsContent value="overview" className="space-y-6">
            <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'} shadow-sm`}>
              <CardHeader>
                <CardTitle className={`text-2xl flex items-center gap-2 ${isDarkMode ? 'text-white' : ''}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  <Upload className="w-6 h-6 text-blue-700" />
                  Upload Bank Statements
                </CardTitle>
                <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>
                  Upload multiple PDF bank statements. You can review and remove files before processing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`flex flex-col items-center justify-center py-12 border-2 border-dashed ${isDarkMode ? 'border-gray-600 bg-gray-700 hover:bg-gray-600' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'} rounded-lg transition-colors`}>
                  <div className="w-20 h-20 bg-blue-700 rounded-lg flex items-center justify-center mb-4 shadow-sm">
                    <Upload className="w-10 h-10 text-white" />
                  </div>
                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-slate-700'} mb-4 font-semibold`}>
                    Select multiple PDF files
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={handleFileSelect}
                    data-testid="file-upload-input"
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button 
                      data-testid="upload-btn"
                      className="bg-blue-700 hover:bg-blue-800 text-white"
                      asChild
                    >
                      <span className="cursor-pointer">
                        <FileCheck className="w-4 h-4 mr-2" />
                        Select Files
                      </span>
                    </Button>
                  </label>
                </div>

                {/* Pending Files List */}
                {pendingFiles.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        Selected Files ({pendingFiles.length})
                      </h3>
                      <Button
                        onClick={handleUploadAll}
                        disabled={uploading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload All
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {pendingFiles.map(file => (
                        <div
                          key={file.id}
                          className={`flex items-center justify-between p-3 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-200'} border rounded-lg`}
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-blue-700" />
                            <div>
                              <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                {file.name}
                              </p>
                              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                                {file.size}
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => removePendingFile(file.id)}
                            variant="ghost"
                            size="icon"
                            className={`${isDarkMode ? 'text-gray-400 hover:text-red-400 hover:bg-gray-600' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Uploads */}
            {uploads.length > 0 && (
              <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'} shadow-sm`}>
                <CardHeader>
                  <CardTitle className={`text-2xl ${isDarkMode ? 'text-white' : ''}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Recent Uploads
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {uploads.slice(0, 5).map((upload) => (
                      <div key={upload.id} className={`flex items-center justify-between p-4 ${isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-650' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'} rounded-lg transition-colors border`}>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-700 rounded-lg flex items-center justify-center">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{upload.filename}</p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                              {upload.bank_name || 'Processing...'} • {new Date(upload.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-xs font-semibold ${
                          upload.status === 'completed' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                          upload.status === 'failed' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                          'bg-amber-100 text-amber-700 border border-amber-200'
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

          {/* Analytics Tab with Charts */}
          <TabsContent value="analytics" className="space-y-6">
            {transactions.length > 0 ? (
              <>
                {/* Monthly Trend Chart */}
                <Card className="border-slate-200 shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      <LineChart className="w-6 h-6 text-blue-700" />
                      Income vs Expenses Trend
                    </CardTitle>
                    <CardDescription>Monthly cash flow analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <AreaChart data={getMonthlyTrendData()}>
                        <defs>
                          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="month" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                          }}
                        />
                        <Legend />
                        <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" name="Income" />
                        <Area type="monotone" dataKey="expenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpenses)" name="Expenses" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Category and Mode Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Category Pie Chart */}
                  <Card className="border-slate-200 shadow-sm bg-white">
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        <PieChart className="w-5 h-5 text-blue-700" />
                        Category Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsPie>
                          <Pie
                            data={getCategoryChartData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {getCategoryChartData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px'
                            }}
                          />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Mode Bar Chart */}
                  <Card className="border-slate-200 shadow-sm bg-white">
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        <BarChart3 className="w-5 h-5 text-blue-700" />
                        Transaction Mode
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsBar data={getModeChartData()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="name" stroke="#64748b" />
                          <YAxis stroke="#64748b" />
                          <Tooltip 
                            formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px'
                            }}
                          />
                          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                            {getModeChartData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </RechartsBar>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <Card className="border-slate-200 shadow-sm bg-white">
                <CardContent className="py-20 text-center">
                  <BarChart3 className="w-20 h-20 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 text-lg">Upload a bank statement to see analytics</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>All Transactions</CardTitle>
                    <CardDescription>{filteredTransactions.length} transactions found</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="px-4 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>
                          {cat === 'all' ? 'All Categories' : cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredTransactions.slice(0, 100).map((txn) => (
                    <div key={txn.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          txn.transaction_type === 'credit' 
                            ? 'bg-emerald-600' 
                            : 'bg-rose-600'
                        }`}>
                          {txn.transaction_type === 'credit' ? (
                            <ArrowUpRight className="w-6 h-6 text-white" />
                          ) : (
                            <ArrowDownRight className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{txn.description}</p>
                          <p className="text-sm text-slate-500">
                            {txn.category} • {txn.mode} • {txn.date}
                          </p>
                        </div>
                      </div>
                      <p className={`font-bold text-lg ${
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
                <Card className="border-slate-200 shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle className="text-2xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Tax Calculation Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      <TaxCard 
                        title="GST" 
                        amount={analytics.latest_tax.gst_amount} 
                        gradient="from-sky-500 to-blue-600" 
                        icon={<DollarSign className="w-6 h-6" />}
                      />
                      <TaxCard 
                        title="ITR" 
                        amount={analytics.latest_tax.itr_amount} 
                        gradient="from-emerald-500 to-teal-600" 
                        icon={<TrendingUpIcon className="w-6 h-6" />}
                      />
                      <TaxCard 
                        title="TDS" 
                        amount={analytics.latest_tax.tds_amount} 
                        gradient="from-purple-500 to-pink-600" 
                        icon={<BarChart3 className="w-6 h-6" />}
                      />
                      <TaxCard 
                        title="Estimated Turnover" 
                        amount={analytics.latest_tax.estimated_turnover} 
                        gradient="from-orange-500 to-red-600" 
                        icon={<Wallet className="w-6 h-6" />}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle className="text-2xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Tax Optimization Tips</CardTitle>
                    <CardDescription>AI-powered recommendations to optimize your tax liability</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.latest_tax.tax_optimization_tips.map((tip, idx) => (
                        <div key={idx} className="flex items-start gap-4 p-5 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors">
                          <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-white">{idx + 1}</span>
                          </div>
                          <p className="text-slate-700 font-medium pt-1">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-slate-200 shadow-sm bg-white">
                <CardContent className="py-20 text-center">
                  <BarChart3 className="w-20 h-20 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 text-lg">Upload a bank statement to see tax analysis</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  <Download className="w-6 h-6 text-blue-700" />
                  Generate Reports
                </CardTitle>
                <CardDescription>Download comprehensive financial reports in multiple formats</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-6">
                  <ReportCard
                    title="PDF Report"
                    description="Comprehensive financial report with charts and summaries"
                    icon={<FileText className="w-8 h-8 text-white" />}
                    gradient="from-red-500 to-pink-500"
                    onClick={generatePDFReport}
                    disabled={!transactions.length}
                  />
                  <ReportCard
                    title="Excel Report"
                    description="Detailed spreadsheet with all financial data"
                    icon={<BarChart3 className="w-8 h-8 text-white" />}
                    gradient="from-green-500 to-emerald-500"
                    onClick={generateExcelReport}
                    disabled={!transactions.length}
                  />
                  <ReportCard
                    title="CSV Export"
                    description="Raw transaction data for external analysis"
                    icon={<Download className="w-8 h-8 text-white" />}
                    gradient="from-blue-500 to-indigo-500"
                    onClick={generateCSVReport}
                    disabled={!transactions.length}
                  />
                </div>
                {!transactions.length && (
                  <p className="text-center text-slate-500 mt-6">Upload a bank statement to generate reports</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tax News Tab */}
          <TabsContent value="news" className="space-y-6">
            <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'} shadow-sm`}>
              <CardHeader>
                <CardTitle className={`text-2xl flex items-center gap-2 ${isDarkMode ? 'text-white' : ''}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  <Newspaper className="w-6 h-6 text-blue-700" />
                  Indian Taxation News & Updates
                </CardTitle>
                <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>
                  Latest news and updates from Income Tax Department, GST Council, and CBDT
                </CardDescription>
              </CardHeader>
              <CardContent>
                {newsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {taxNews.map((news, idx) => (
                      <div
                        key={idx}
                        className={`p-4 ${isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-650' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'} border rounded-lg transition-colors cursor-pointer`}
                        onClick={() => window.open(news.link, '_blank')}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            {news.title}
                          </h3>
                          <span className={`text-xs ${isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-blue-100 text-blue-700'} px-2 py-1 rounded whitespace-nowrap ml-2`}>
                            {news.source}
                          </span>
                        </div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-slate-600'} mb-2`}>
                          {news.description}
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                          {new Date(news.date).toLocaleDateString('en-IN', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Chat Tab */}
          <TabsContent value="chat">
            <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'} shadow-sm`}>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  <MessageSquare className="w-6 h-6 text-blue-700" />
                  AI Tax Assistant
                </CardTitle>
                <CardDescription>Ask me anything about Indian taxes, GST, ITR, or your financial data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-[500px] overflow-y-auto space-y-4 p-6 bg-slate-50 rounded-lg border border-slate-200">
                    {chatHistory.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-blue-700 rounded-lg flex items-center justify-center mb-6">
                          <MessageSquare className="w-10 h-10 text-white" />
                        </div>
                        <p className="text-slate-700 text-lg font-semibold mb-2">Start a conversation</p>
                        <p className="text-slate-500">Ask about tax calculations, deductions, or financial insights</p>
                      </div>
                    ) : (
                      chatHistory.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-4 rounded-lg ${
                            msg.role === 'user' 
                              ? 'bg-blue-700 text-white' 
                              : 'bg-white border border-slate-300 text-slate-900'
                          }`}>
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                          </div>
                        </div>
                      ))
                    )}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 p-4 rounded-lg">
                          <Loader2 className="w-6 h-6 animate-spin text-blue-700" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
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
                      className="min-h-[70px] resize-none bg-white border-slate-300 focus:border-blue-700"
                      disabled={chatLoading}
                    />
                    <Button
                      onClick={handleChat}
                      disabled={!chatMessage.trim() || chatLoading}
                      data-testid="chat-send-btn"
                      className="bg-blue-700 hover:bg-blue-800 text-white h-[70px] px-8"
                    >
                      <Send className="w-6 h-6" />
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

const KPICard = ({ title, value, icon, trend, trendUp, bgColor, isDarkMode }) => {
  return (
    <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'} border shadow-sm overflow-hidden hover:shadow-md transition-shadow`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-14 h-14 ${bgColor} rounded-lg flex items-center justify-center`}>
            {icon}
          </div>
          {trend && (
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
              trendUp ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-rose-100 text-rose-700 border border-rose-200'
            }`}>
              {trend}
            </span>
          )}
        </div>
        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-slate-600'} mb-2 font-medium`}>{title}</p>
        <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{value}</p>
      </CardContent>
    </Card>
  );
};

const TaxCard = ({ title, amount, gradient, icon }) => {
  // Convert gradient prop to solid color
  const colorMap = {
    'from-sky-500 to-blue-600': 'bg-blue-700',
    'from-emerald-500 to-teal-600': 'bg-emerald-600',
    'from-purple-500 to-pink-600': 'bg-purple-700',
    'from-orange-500 to-red-600': 'bg-orange-600'
  };
  const bgColor = colorMap[gradient] || 'bg-blue-700';
  
  return (
    <div className={`p-6 ${bgColor} rounded-lg shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-white/90 font-semibold">{title}</p>
        <div className="text-white/90">
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  );
};

const ReportCard = ({ title, description, icon, gradient, onClick, disabled }) => {
  // Convert gradient prop to solid color
  const colorMap = {
    'from-red-500 to-pink-500': 'bg-red-600',
    'from-green-500 to-emerald-500': 'bg-emerald-600',
    'from-blue-500 to-indigo-500': 'bg-blue-700'
  };
  const bgColor = colorMap[gradient] || 'bg-blue-700';
  
  return (
    <div 
      onClick={!disabled ? onClick : undefined}
      className={`p-6 bg-white rounded-lg border-2 border-slate-200 hover:border-blue-300 transition-all ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'
      }`}
    >
      <div className={`w-16 h-16 ${bgColor} rounded-lg flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{title}</h3>
      <p className="text-sm text-slate-600">{description}</p>
      <Button 
        disabled={disabled}
        className={`w-full mt-4 ${bgColor} hover:opacity-90 text-white`}
      >
        <Download className="w-4 h-4 mr-2" />
        Download
      </Button>
    </div>
  );
};

export default Dashboard;
