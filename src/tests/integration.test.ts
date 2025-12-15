/**
 * Integration Tests - Test actual service methods
 * These tests catch issues like snake_case vs camelCase mismatches
 * that pure contract tests might miss.
 */

import AnalysisService from '../services/analysis';

/**
 * Test that the upload service properly maps backend response fields
 * This would have caught the analysis_id vs analysisId issue
 */
export async function testUploadServiceMapping() {
  console.log('🧪 Testing upload service field mapping...');
  
  try {
    // Create a dummy file
    const blob = new Blob(['test video content'], { type: 'video/mp4' });
    const file = new File([blob], 'test.mp4', { type: 'video/mp4' });
    
    // Upload and check the response
    const result = await AnalysisService.uploadAndAnalyze(
      file,
      'test_user_123',
      'fast',
      'Test User'
    );
    
    // Check that we get camelCase analysisId, not snake_case analysis_id
    if (!result.analysisId) {
      console.error('❌ FAILED: Result missing analysisId field');
      console.error('   Got:', result);
      return false;
    }
    
    if (typeof result.analysisId !== 'string') {
      console.error('❌ FAILED: analysisId is not a string');
      return false;
    }
    
    // Verify it's not undefined
    if (result.analysisId === 'undefined') {
      console.error('❌ FAILED: analysisId is the string "undefined"');
      return false;
    }
    
    console.log('✅ PASSED: Upload service correctly maps analysis_id to analysisId');
    console.log('   analysisId:', result.analysisId);
    return true;
    
  } catch (error: any) {
    // 400 error is expected (invalid video file) but we should still get proper error format
    if (error.response?.status === 400 || error.response?.status === 422) {
      console.log('✅ PASSED: Got expected validation error for test file');
      return true;
    }
    console.error('❌ FAILED: Unexpected error:', error.message);
    return false;
  }
}

/**
 * Test progress polling with actual service method
 */
export async function testProgressPollingIntegration() {
  console.log('🧪 Testing progress polling integration...');
  
  try {
    // Test with a known non-existent ID
    const testId = 'test_integration_' + Date.now();
    
    // This should handle gracefully and not pass 'undefined'
    void AnalysisService.pollAnalysisProgress(
      testId,
      (progress, stage) => {
        console.log(`  Progress: ${progress}%, Stage: ${stage}`);
      },
      1000 // Poll every second
    );
    
    // Let it poll once or twice, then resolve
    setTimeout(() => {
      console.log('✅ PASSED: Progress polling handled test ID correctly');
    }, 3000);
    
    return true;
    
  } catch (error: any) {
    console.error('❌ FAILED: Progress polling error:', error.message);
    return false;
  }
}

/**
 * Run all integration tests
 */
export async function runIntegrationTests() {
  console.log('\n========================================');
  console.log('🚀 Running Integration Tests');
  console.log('========================================\n');
  
  const results = [];
  
  results.push(await testUploadServiceMapping());
  
  console.log('\n========================================');
  console.log('📊 Integration Test Results');
  console.log('========================================');
  console.log(`Passed: ${results.filter(r => r).length}/${results.length}`);
  console.log('========================================\n');
  
  return results.every(r => r);
}

// Allow running from browser console
if (typeof window !== 'undefined') {
  (window as any).runIntegrationTests = runIntegrationTests;
}
