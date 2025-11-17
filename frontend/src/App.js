import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Upload, BarChart3, Download, FileText, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import html2canvas from "html2canvas";
const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #EBF4FF 0%, #C3DAFE 100%);
  padding: 2rem;
`;

const MaxWidth = styled.div`
  max-width: 1280px;
  margin: 0 auto;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: bold;
  color: #1F2937;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
`;

const Subtitle = styled.p`
  color: #6B7280;
  font-size: 1rem;
`;

const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  background-color: ${props => props.isConnected ? '#D1FAE5' : '#FEE2E2'};
  color: ${props => props.isConnected ? '#065F46' : '#991B1B'};
`;

const Card = styled.div`
  background: white;
  border-radius: 1rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  padding: 2rem;
  margin-bottom: 1.5rem;
`;

const UploadLabel = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 12rem;
  border: 2px dashed #A5B4FC;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: #6366F1;
    background-color: #EEF2FF;
  }
`;

const UploadContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.25rem 1.5rem;
`;

const UploadTitle = styled.p`
  margin-bottom: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
`;

const UploadSubtext = styled.p`
  font-size: 0.875rem;
  color: #6B7280;
`;

const UploadHint = styled.p`
  font-size: 0.75rem;
  color: #9CA3AF;
  margin-top: 0.5rem;
`;

const HiddenInput = styled.input`
  display: none;
`;

const ErrorBox = styled.div`
  background-color: #FEF2F2;
  border-left: 4px solid #EF4444;
  padding: 1rem;
  margin-bottom: 1.5rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
`;

const ErrorTitle = styled.p`
  color: #B91C1C;
  font-weight: 600;
`;

const ErrorMessage = styled.p`
  color: #DC2626;
  font-size: 0.875rem;
`;

const LoadingContainer = styled.div`
  text-align: center;
  padding: 3rem 0;
`;

const Spinner = styled.div`
  display: inline-block;
  width: 4rem;
  height: 4rem;
  border: 4px solid #E0E7FF;
  border-top-color: #4F46E5;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  margin-top: 1rem;
  color: #6B7280;
  font-size: 1.125rem;
`;

const LoadingSubtext = styled.p`
  color: #9CA3AF;
  font-size: 0.875rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const StatCard = styled.div`
  background: ${props => props.gradient || 'white'};
  border-radius: 0.75rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  color: ${props => props.gradient ? 'white' : '#1F2937'};
`;

const StatContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const StatLabel = styled.p`
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
  opacity: ${props => props.light ? 0.9 : 0.7};
`;

const StatValue = styled.p`
  font-size: 1.875rem;
  font-weight: bold;
`;

const StatPercent = styled.p`
  font-size: 0.875rem;
  margin-top: 0.25rem;
  opacity: 0.9;
`;

const IconWrapper = styled.div`
  opacity: 0.2;
`;

const ChartCard = styled(Card)``;

const ChartTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #1F2937;
`;

const BarContainer = styled.div`
  height: 3rem;
  display: flex;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
`;

const BarSegment = styled.div`
  background-color: ${props => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  transition: width 0.5s ease;
  width: ${props => props.width}%;
`;

const BarLabels = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #6B7280;
`;

const BarChartBarContainer = styled.div`
  flex: 1;
  background-color: #F3F4F6;
  border-radius: 0.5rem;
  height: 2.5rem;
  overflow: hidden;
  position: relative;
`;

const BarChartBar = styled.div`
  height: 100%;
  background: ${props => props.color};
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  padding: 0 1rem;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  transition: width 0.5s ease;
  width: ${props => props.width}%;
  min-width: ${props => props.width > 0 ? '50px' : '0'};
`;

const BarChartValue = styled.div`
  min-width: 60px;
  text-align: right;
  font-weight: 600;
  font-size: 1rem;
  color: #1F2937;
`;

const DownloadButton = styled.button`
  width: 100%;
  background: linear-gradient(135deg, #4F46E5 0%, #6366F1 100%);
  color: white;
  font-weight: 600;
  padding: 1rem;
  border-radius: 0.75rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  transition: background 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  cursor: pointer;
  margin-bottom: 1.5rem;

  &:hover {
    background: linear-gradient(135deg, #4338CA 0%, #4F46E5 100%);
  }
`;

const TableCard = styled(Card)`
  overflow: hidden;
  padding: 0;
`;

const TableHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #E5E7EB;
  background: linear-gradient(135deg, #EEF2FF 0%, #F3E8FF 100%);
`;

const TableTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1F2937;
`;

const TableSubtitle = styled.p`
  font-size: 0.875rem;
  color: #6B7280;
  margin-top: 0.25rem;
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  max-height: 500px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Thead = styled.thead`
  background-color: #F9FAFB;
  position: sticky;
  top: 0;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
`;

const Th = styled.th`
  padding: 0.75rem 1.5rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 500;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const Tbody = styled.tbody`
  background: white;
  divide-y divide-gray-200;
`;

const Tr = styled.tr`
  transition: background-color 0.2s;

  &:hover {
    background-color: #F9FAFB;
  }
`;

const Td = styled.td`
  padding: 1rem 1.5rem;
  font-size: 0.875rem;
  color: ${props => props.muted ? '#6B7280' : '#111827'};
  white-space: ${props => props.nowrap ? 'nowrap' : 'normal'};
  max-width: ${props => props.maxWidth || 'auto'};
`;

const Badge = styled.span`
  padding: 0.25rem 0.75rem;
  display: inline-flex;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 9999px;
  background-color: ${props => props.positive ? '#D1FAE5' : '#FEE2E2'};
  color: ${props => props.positive ? '#065F46' : '#991B1B'};
`;

const ConfidenceContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ProgressBar = styled.div`
  flex: 1;
  background-color: #E5E7EB;
  border-radius: 9999px;
  height: 0.5rem;
  width: 60px;
`;

const ProgressFill = styled.div`
  height: 0.5rem;
  border-radius: 9999px;
  background-color: ${props => props.positive ? '#10B981' : '#EF4444'};
  width: ${props => props.width}%;
`;

const ConfidenceText = styled.span`
  font-size: 0.875rem;
  color: #6B7280;
  font-weight: 500;
`;

const InstructionsCard = styled(Card)`
  margin-top: 1.5rem;
`;

const InstructionsTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 1rem;
`;

const InstructionsList = styled.ol`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  color: #6B7280;
`;

const InstructionItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
`;

const InstructionNumber = styled.span`
  font-weight: 600;
  color: #4F46E5;
`;

const SentimentAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ positive: 0, negative: 0 });
  const [backendStatus, setBackendStatus] = useState(null);
  const chartRef = useRef(null);

  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/health');
      const data = await response.json();
      setBackendStatus(data);
    } catch (err) {
      setBackendStatus({ status: 'offline' });
    }
  };

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;
    
    setFile(uploadedFile);
    setError(null);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        
        if (json.length === 0) {
          setError('File is empty');
          return;
        }
        
        const tweets = json.map(row => {
          const keys = Object.keys(row);
          const text = String(row[keys[0]] || '').trim();
          return { text };
        }).filter(t => t.text && t.text.length > 0);
        
        if (tweets.length === 0) {
          setError('No valid tweets found in file. Make sure the first column contains text.');
          return;
        }
        
        await analyzeTweets(tweets);
      } catch (err) {
        setError('Error reading file: ' + err.message);
        console.error('File read error:', err);
      }
    };
    reader.readAsArrayBuffer(uploadedFile);
  };

  const analyzeTweets = async (tweets) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://127.0.0.1:8000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweets })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Analysis failed');
      }
      
      const responseData = await response.json();
      
      const data = responseData.data || responseData;
      setResults(data);
      
      const positive = data.filter(r => 
        (r.sentiment || '').toLowerCase() === 'positive'
      ).length;
      const negative = data.filter(r => 
        (r.sentiment || '').toLowerCase() === 'negative'
      ).length;
      
      setStats({ positive, negative });
      
    } catch (err) {
      setError(err.message || 'Error connecting to backend. Make sure FastAPI server is running on port 8000.');
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = async () => {
    if (results.length === 0) {
      setError('No results to download');
      return;
    }
    
    try {
      const tweets = results.map(r => ({ text: r.tweet }));
      
      const response = await fetch('http://127.0.0.1:8000/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweets })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sentiment_analysis_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Download failed: ' + err.message);
      console.error('Download error:', err);
    }
  };

  const downloadChart = async () => {
    if (!chartRef.current) return;
  
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
      });
  
      const img = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = img;
      link.download = `sentiment_chart_${new Date().toISOString().slice(0,10)}.png`;
      link.click();
    } catch (err) {
      console.error("Chart download failed:", err);
    }
  };  

  const totalTweets = stats.positive + stats.negative;
  const positivePercent = totalTweets ? (stats.positive / totalTweets * 100).toFixed(1) : 0;
  const negativePercent = totalTweets ? (stats.negative / totalTweets * 100).toFixed(1) : 0;

  return (
    <Container>
      <MaxWidth>
        <Header>
          <Title>
            <TrendingUp size={40} color="#4F46E5" />
            Tesla Tweet Sentiment Analyzer
          </Title>
          <Subtitle>Upload your tweet data and get instant sentiment analysis</Subtitle>
          
          {backendStatus && (
            <StatusBadge isConnected={backendStatus.hybrid_ready}>
              {backendStatus.hybrid_ready ? (
                <>
                  <CheckCircle size={16} />
                  Backend Connected & Model Loaded
                </>
              ) : (
                <>
                  <AlertCircle size={16} />
                  Backend Issue - Check Console
                </>
              )}
            </StatusBadge>
          )}
        </Header>

        <Card>
          <UploadLabel>
            <UploadContent>
              <Upload size={48} color="#6366F1" style={{ marginBottom: '0.75rem' }} />
              <UploadTitle>
                {file ? `✓ ${file.name}` : 'Click to upload or drag and drop'}
              </UploadTitle>
              <UploadSubtext>Excel (.xlsx, .xls) or CSV files</UploadSubtext>
              <UploadHint>First column should contain tweets</UploadHint>
            </UploadContent>
            <HiddenInput 
              type="file" 
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
            />
          </UploadLabel>
        </Card>

        {error && (
          <ErrorBox>
            <AlertCircle size={24} color="#EF4444" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
            <div>
              <ErrorTitle>Error</ErrorTitle>
              <ErrorMessage>{error}</ErrorMessage>
            </div>
          </ErrorBox>
        )}

        {loading && (
          <LoadingContainer>
            <Spinner />
            <LoadingText>Analyzing sentiments...</LoadingText>
            <LoadingSubtext>This may take a few seconds</LoadingSubtext>
          </LoadingContainer>
        )}

        {results.length > 0 && !loading && (
          <>
            <Grid>
              <StatCard>
                <StatContent>
                  <div>
                    <StatLabel>Total Tweets</StatLabel>
                    <StatValue>{totalTweets}</StatValue>
                  </div>
                  <IconWrapper>
                    <FileText size={48} color="#3B82F6" />
                  </IconWrapper>
                </StatContent>
              </StatCard>

              <StatCard gradient="linear-gradient(135deg, #10B981 0%, #059669 100%)">
                <StatContent>
                  <div>
                    <StatLabel light>Positive</StatLabel>
                    <StatValue>{stats.positive}</StatValue>
                    <StatPercent>{positivePercent}%</StatPercent>
                  </div>
                  <IconWrapper>
                    <BarChart3 size={48} />
                  </IconWrapper>
                </StatContent>
              </StatCard>

              <StatCard gradient="linear-gradient(135deg, #EF4444 0%, #DC2626 100%)">
                <StatContent>
                  <div>
                    <StatLabel light>Negative</StatLabel>
                    <StatValue>{stats.negative}</StatValue>
                    <StatPercent>{negativePercent}%</StatPercent>
                  </div>
                  <IconWrapper>
                    <BarChart3 size={48} />
                  </IconWrapper>
                </StatContent>
              </StatCard>
            </Grid>

            <ChartCard ref={chartRef}>
              <ChartTitle>Sentiment Distribution</ChartTitle>
              <BarContainer>
                <BarSegment color="#10B981" width={positivePercent}>
                  {positivePercent > 10 && `${positivePercent}%`}
                </BarSegment>
                <BarSegment color="#EF4444" width={negativePercent}>
                  {negativePercent > 10 && `${negativePercent}%`}
                </BarSegment>
              </BarContainer>
              <BarLabels>
                <span>← More Positive</span>
                <span>More Negative →</span>
              </BarLabels>
            </ChartCard>

            <DownloadButton onClick={downloadExcel}>
              <Download size={20} />
              Download Full Report (Excel)
            </DownloadButton>
            
            <DownloadButton onClick={downloadChart}>
              <Download size={20} />
              Download Chart as Image (PNG)
            </DownloadButton>

            <TableCard>
              <TableHeader>
                <TableTitle>Detailed Results</TableTitle>
                <TableSubtitle>Showing {results.length} analyzed tweets</TableSubtitle>
              </TableHeader>
              <TableWrapper>
                <Table>
                  <Thead>
                    <tr>
                      <Th>#</Th>
                      <Th>Tweet</Th>
                      <Th>Sentiment</Th>
                      <Th>Confidence</Th>
                    </tr>
                  </Thead>
                  <Tbody>
                    {results.map((result, idx) => (
                      <Tr key={idx}>
                        <Td muted nowrap>{idx + 1}</Td>
                        <Td maxWidth="500px">{result.tweet}</Td>
                        <Td nowrap>
                          <Badge positive={(result.sentiment || '').toLowerCase() === 'positive'}>
                            {result.sentiment}
                          </Badge>
                        </Td>
                        <Td nowrap>
                          <ConfidenceContainer>
                            <ProgressBar>
                              <ProgressFill 
                                positive={(result.sentiment || '').toLowerCase() === 'positive'}
                                width={result.score * 100}
                              />
                            </ProgressBar>
                            <ConfidenceText>
                              {(result.score * 100).toFixed(1)}%
                            </ConfidenceText>
                          </ConfidenceContainer>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableWrapper>
            </TableCard>
          </>
        )}

        {results.length === 0 && !loading && (
          <InstructionsCard>
            <InstructionsTitle>How to use:</InstructionsTitle>
            <InstructionsList>
              <InstructionItem>
                <InstructionNumber>1.</InstructionNumber>
                <span>Prepare an Excel (.xlsx) or CSV file with tweets in the first column</span>
              </InstructionItem>
              <InstructionItem>
                <InstructionNumber>2.</InstructionNumber>
                <span>Upload your file using the upload area above</span>
              </InstructionItem>
              <InstructionItem>
                <InstructionNumber>3.</InstructionNumber>
                <span>Wait for the analysis to complete (usually takes a few seconds)</span>
              </InstructionItem>
              <InstructionItem>
                <InstructionNumber>4.</InstructionNumber>
                <span>View results and download the Excel report</span>
              </InstructionItem>
            </InstructionsList>
          </InstructionsCard>
        )}
      </MaxWidth>
    </Container>
  );
};

export default SentimentAnalyzer;