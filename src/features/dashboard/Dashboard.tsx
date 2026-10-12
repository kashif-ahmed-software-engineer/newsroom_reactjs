// src/features/dashboard/Dashboard.tsx
import React, { useState } from 'react';
import { Box, Paper } from '@mui/material';
import { useGetDashboardQuery } from '../../services/api';
import { Story } from '../../types';
import StoryGrid from './StoryGrid';
import StoryEditor from './StoryEditor';
import ResizableSplitter from '../../components/ResizableSplitter';

const Dashboard: React.FC = () => {
  const { data, isLoading, error, refetch } = useGetDashboardQuery();
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [rightPanelWidth, setRightPanelWidth] = useState(480);

  if (isLoading) return <Box sx={{ p: 4 }}>Loading...</Box>;
  if (error) return <Box sx={{ p: 4, color: 'error.main' }}>Failed to load dashboard.</Box>;
  
  const stories = data?.stories || [];
  const rundowns = data?.rundowns || [];

  return (
    <Box sx={{ display: 'flex', height: '100%', bgcolor: 'background.default' }}>
      <Box sx={{ flex: 1, minWidth: 320, display: 'flex', flexDirection: 'column' }}>
        <StoryGrid
          stories={stories}
          selectedStoryId={selectedStory?.id}
          onSelectStory={setSelectedStory}
          onStoriesChanged={refetch}
        />
      </Box>
      <ResizableSplitter width={rightPanelWidth} onResize={setRightPanelWidth} minWidth={280} maxWidth="75%" />
      <Paper
        sx={{
          width: rightPanelWidth,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: 1,
          borderColor: 'divider',
          bgcolor: '#fff',
          overflow: 'hidden',
        }}
      >
        <StoryEditor
          story={selectedStory}
          onStoryUpdated={refetch}          
          rundowns={rundowns}
          allStories={stories}
        />
      </Paper>
    </Box>
  );
};

export default Dashboard;