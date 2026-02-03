import { test, expect } from '@playwright/test'

test.describe('Streaming Analyze Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the analyze page
    await page.goto('http://localhost:3001/scenarios/2/analyze')
    
    // Wait for the page to load
    await page.waitForSelector('textarea[placeholder="描述业务场景细节..."]')
  })

  test('should display streaming content in real-time', async ({ page }) => {
    // Type a message
    const textarea = page.locator('textarea[placeholder="描述业务场景细节..."]')
    await textarea.fill('分析')
    
    // Click send button
    await page.click('button:has-text("发送")')
    
    // Wait for streaming to start
    await page.waitForSelector('.animate-pulse', { timeout: 5000 })
    
    // Check that streaming content is being displayed
    // We should see the assistant message container
    const assistantMessages = page.locator('.assistant-message')
    const lastAssistantMessage = assistantMessages.last()
    
    // Wait a bit for some chunks to arrive
    await page.waitForTimeout(2000)
    
    // Get the content of the last assistant message
    const messageContent = lastAssistantMessage.locator('.message-content')
    const content = await messageContent.textContent()
    
    console.log('Message content length:', content?.length || 0)
    console.log('First 100 chars:', content?.substring(0, 100))
    
    // The content should not be empty during streaming
    expect(content).not.toBe('')
    expect(content).not.toBe('描述业务场景细节...')
    
    // Wait for streaming to complete
    await page.waitForSelector('.animate-pulse', { state: 'hidden', timeout: 30000 })
    
    // After streaming completes, content should still be visible
    const finalContent = await messageContent.textContent()
    console.log('Final content length:', finalContent?.length || 0)
    expect(finalContent).not.toBe('')
  })

  test('should show console logs during streaming', async ({ page }) => {
    const consoleLogs: string[] = []
    
    page.on('console', msg => {
      if (msg.text().includes('Chunk received')) {
        consoleLogs.push(msg.text())
      }
    })
    
    // Type and send a message
    const textarea = page.locator('textarea[placeholder="描述业务场景细节..."]')
    await textarea.fill('分析')
    await page.click('button:has-text("发送")')
    
    // Wait for streaming to complete
    await page.waitForTimeout(10000)
    
    console.log('Total chunk logs:', consoleLogs.length)
    console.log('Sample logs:', consoleLogs.slice(0, 5))
    
    // We should have received multiple chunks
    expect(consoleLogs.length).toBeGreaterThan(0)
  })
})
