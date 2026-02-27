import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import PricingCalculator from '../components/Calculator/PricingCalculator'
import { MenuItem } from '@/lib/types'

// Helper to create a valid MenuItem for tests
function makeItem(overrides: Partial<MenuItem> = {}): MenuItem {
  return {
    id: '1',
    name: 'Grilled Salmon',
    category: 'Mains',
    menuPrice: 28,
    foodCost: 9,
    unitsSold: 150,
    periodDays: 30,
    contributionMargin: 19,
    foodCostPercent: 32.14,
    totalProfit: 2850,
    salesMixPercent: 25,
    classification: 'star',
    recommendedAction: 'Keep & feature',
    ...overrides,
  }
}

describe('PricingCalculator', () => {
  describe('Integration', () => {
    it('renders both calculators on the same page', () => {
      render(<PricingCalculator items={[]} />)
      expect(screen.getByText('Price a New Item')).toBeInTheDocument()
      expect(screen.getByText('Adjust Existing Item')).toBeInTheDocument()
    })

    it('both calculators show empty states by default', () => {
      render(<PricingCalculator items={[]} />)
      expect(screen.getByText('Enter a plate cost to see pricing suggestions')).toBeInTheDocument()
      expect(screen.getByText('Enter current values and a new cost or price to see impact')).toBeInTheDocument()
    })

    it('forward and reverse calculators operate independently', () => {
      const items = [makeItem()]
      render(<PricingCalculator items={items} />)

      // Fill forward calculator plate cost
      const plateCostInput = screen.getByPlaceholderText('e.g. 8.50')
      fireEvent.change(plateCostInput, { target: { value: '10' } })

      // Forward calculator shows results
      expect(screen.getByText('Suggested Price')).toBeInTheDocument()

      // Reverse calculator still shows empty state
      expect(screen.getByText('Enter current values and a new cost or price to see impact')).toBeInTheDocument()
    })
  })

  describe('ForwardCalculator', () => {
    it('renders "Price a New Item" heading', () => {
      render(<PricingCalculator items={[]} />)
      expect(screen.getByText('Price a New Item')).toBeInTheDocument()
    })

    it('shows empty state message when no plate cost entered', () => {
      render(<PricingCalculator items={[]} />)
      expect(screen.getByText('Enter a plate cost to see pricing suggestions')).toBeInTheDocument()
    })

    it('calculates and displays suggested price when plate cost entered', () => {
      render(<PricingCalculator items={[]} />)
      const plateCostInput = screen.getByPlaceholderText('e.g. 8.50')
      fireEvent.change(plateCostInput, { target: { value: '9' } })

      // 9 / 0.30 = 30.00
      expect(screen.getByText('$30.00')).toBeInTheDocument()
      expect(screen.getByText('Suggested Price')).toBeInTheDocument()
    })

    it('shows conservative and aggressive price tiers', () => {
      render(<PricingCalculator items={[]} />)
      const plateCostInput = screen.getByPlaceholderText('e.g. 8.50')
      fireEvent.change(plateCostInput, { target: { value: '9' } })

      expect(screen.getByText('Conservative (−10%)')).toBeInTheDocument()
      expect(screen.getByText('Aggressive (+10%)')).toBeInTheDocument()
      // Conservative: 30 * 0.9 = 27.00
      expect(screen.getByText('$27.00')).toBeInTheDocument()
      // Aggressive: 30 * 1.1 = 33.00
      expect(screen.getByText('$33.00')).toBeInTheDocument()
    })

    it('shows premium price when perceived value >= 4', () => {
      render(<PricingCalculator items={[]} />)
      const plateCostInput = screen.getByPlaceholderText('e.g. 8.50')
      fireEvent.change(plateCostInput, { target: { value: '9' } })

      // Click perceived value 4
      const pvButton4 = screen.getByRole('button', { name: '4' })
      fireEvent.click(pvButton4)

      expect(screen.getByText('Premium (+20%)')).toBeInTheDocument()
      // Premium: 30 * 1.2 = 36.00
      expect(screen.getByText('$36.00')).toBeInTheDocument()
    })

    it('hides premium price when perceived value < 4', () => {
      render(<PricingCalculator items={[]} />)
      const plateCostInput = screen.getByPlaceholderText('e.g. 8.50')
      fireEvent.change(plateCostInput, { target: { value: '9' } })

      // Default perceived value is 3
      expect(screen.queryByText('Premium (+20%)')).not.toBeInTheDocument()
    })

    it('quick-select buttons update target food cost %', () => {
      render(<PricingCalculator items={[]} />)
      const plateCostInput = screen.getByPlaceholderText('e.g. 8.50')
      fireEvent.change(plateCostInput, { target: { value: '10' } })

      // Click 25% quick-select button
      const btn25 = screen.getByRole('button', { name: '25%' })
      fireEvent.click(btn25)

      // 10 / 0.25 = 40.00
      expect(screen.getByText('$40.00')).toBeInTheDocument()
    })

    it('perceived value buttons update selection', () => {
      render(<PricingCalculator items={[]} />)
      const plateCostInput = screen.getByPlaceholderText('e.g. 8.50')
      fireEvent.change(plateCostInput, { target: { value: '9' } })

      // Click PV 5
      const pvButton5 = screen.getByRole('button', { name: '5' })
      fireEvent.click(pvButton5)

      // PV 5 >= 4, so premium should show
      expect(screen.getByText('Premium (+20%)')).toBeInTheDocument()

      // Click PV 2
      const pvButton2 = screen.getByRole('button', { name: '2' })
      fireEvent.click(pvButton2)

      // PV 2 < 4, so premium should hide
      expect(screen.queryByText('Premium (+20%)')).not.toBeInTheDocument()
    })

    it('shows competitor range warning when price is outside range', () => {
      render(<PricingCalculator items={[]} />)
      const plateCostInput = screen.getByPlaceholderText('e.g. 8.50')
      fireEvent.change(plateCostInput, { target: { value: '9' } })

      // Suggested price = $30.00. Set competitor range above that.
      const optionalInputs = screen.getAllByPlaceholderText('Optional')
      fireEvent.change(optionalInputs[0], { target: { value: '35' } })
      fireEvent.change(optionalInputs[1], { target: { value: '45' } })

      expect(screen.getByText('Suggested price falls outside the competitor range')).toBeInTheDocument()
    })

    it('hides competitor warning when price is within range', () => {
      render(<PricingCalculator items={[]} />)
      const plateCostInput = screen.getByPlaceholderText('e.g. 8.50')
      fireEvent.change(plateCostInput, { target: { value: '9' } })

      // Suggested price = $30.00. Set range around it.
      const inputs = screen.getAllByPlaceholderText('Optional')
      fireEvent.change(inputs[0], { target: { value: '25' } })
      fireEvent.change(inputs[1], { target: { value: '35' } })

      expect(screen.queryByText('Suggested price falls outside the competitor range')).not.toBeInTheDocument()
    })

    it('shows correct contribution margins', () => {
      render(<PricingCalculator items={[]} />)
      const plateCostInput = screen.getByPlaceholderText('e.g. 8.50')
      fireEvent.change(plateCostInput, { target: { value: '9' } })

      // Suggested margin: 30 - 9 = 21.00
      // Conservative margin: 27 - 9 = 18.00
      // Aggressive margin: 33 - 9 = 24.00
      const marginTexts = screen.getAllByText(/Margin:/)
      expect(marginTexts.length).toBeGreaterThanOrEqual(3)
      expect(screen.getByText('Margin: $21.00 per plate')).toBeInTheDocument()
      expect(screen.getByText('Margin: $18.00 per plate')).toBeInTheDocument()
      expect(screen.getByText('Margin: $24.00 per plate')).toBeInTheDocument()
    })

    it('shows empty state for zero plate cost', () => {
      render(<PricingCalculator items={[]} />)
      const plateCostInput = screen.getByPlaceholderText('e.g. 8.50')

      // Enter and then clear
      fireEvent.change(plateCostInput, { target: { value: '10' } })
      fireEvent.change(plateCostInput, { target: { value: '0' } })

      expect(screen.getByText('Enter a plate cost to see pricing suggestions')).toBeInTheDocument()
    })
  })

  describe('ReverseCalculator', () => {
    it('renders "Adjust Existing Item" heading', () => {
      render(<PricingCalculator items={[]} />)
      expect(screen.getByText('Adjust Existing Item')).toBeInTheDocument()
    })

    it('shows empty state when no values entered', () => {
      render(<PricingCalculator items={[]} />)
      expect(screen.getByText('Enter current values and a new cost or price to see impact')).toBeInTheDocument()
    })

    it('shows item selector dropdown when items provided', () => {
      const items = [makeItem()]
      render(<PricingCalculator items={items} />)

      expect(screen.getByText('Select Existing Item')).toBeInTheDocument()
      expect(screen.getByText(/Grilled Salmon/)).toBeInTheDocument()
    })

    it('hides item selector when no items provided', () => {
      render(<PricingCalculator items={[]} />)
      expect(screen.queryByText('Select Existing Item')).not.toBeInTheDocument()
    })

    it('pre-fills fields when item selected from dropdown', () => {
      const items = [makeItem({ id: 'item-1', name: 'Grilled Salmon', menuPrice: 28, foodCost: 9, unitsSold: 150, periodDays: 30 })]
      render(<PricingCalculator items={items} />)

      const select = screen.getByDisplayValue('— Or enter manually below —')
      fireEvent.change(select, { target: { value: 'item-1' } })

      // Current price should be 28, current cost should be 9
      const priceInput = screen.getByDisplayValue('28')
      const costInput = screen.getByDisplayValue('9')
      expect(priceInput).toBeInTheDocument()
      expect(costInput).toBeInTheDocument()
    })

    it('calculates margin change when new cost entered', () => {
      render(<PricingCalculator items={[]} />)

      // Forward: plateCost(0), targetFoodCost%(1), compLow(2), compHigh(3)
      // Reverse: currentPrice(4), currentCost(5), newCost(6), newPrice(7), monthlyUnits(8)
      const allInputs = screen.getAllByRole('spinbutton')
      fireEvent.change(allInputs[4], { target: { value: '30' } })
      fireEvent.change(allInputs[5], { target: { value: '10' } })

      const newCostInput = screen.getByPlaceholderText('Leave empty if adjusting price instead')
      fireEvent.change(newCostInput, { target: { value: '12' } })

      // Should show margin change: new margin 18 - old margin 20 = -2
      // formatCurrency(-2) produces "$-2.00"
      expect(screen.getByText('Margin Change Per Plate')).toBeInTheDocument()
      expect(screen.getByText(/\$-2\.00/)).toBeInTheDocument()
    })

    it('shows red styling for negative margin change', () => {
      render(<PricingCalculator items={[]} />)

      const allInputs = screen.getAllByRole('spinbutton')
      fireEvent.change(allInputs[4], { target: { value: '30' } })
      fireEvent.change(allInputs[5], { target: { value: '10' } })

      const newCostInput = screen.getByPlaceholderText('Leave empty if adjusting price instead')
      fireEvent.change(newCostInput, { target: { value: '12' } })

      // Negative margin → red text
      const marginChangeText = screen.getByText(/\$-2\.00/)
      expect(marginChangeText.className).toContain('text-red')
    })

    it('shows green styling for positive margin change', () => {
      render(<PricingCalculator items={[]} />)

      const allInputs = screen.getAllByRole('spinbutton')
      fireEvent.change(allInputs[4], { target: { value: '30' } })
      fireEvent.change(allInputs[5], { target: { value: '10' } })

      const newPriceInput = screen.getByPlaceholderText('Leave empty if adjusting cost instead')
      fireEvent.change(newPriceInput, { target: { value: '35' } })

      // Positive margin → green text: new margin 25, old 20, change +5
      const marginChangeText = screen.getByText(/\+\$5\.00/)
      expect(marginChangeText.className).toContain('text-green')
    })

    it('displays monthly profit impact when units provided', () => {
      render(<PricingCalculator items={[]} />)

      const allInputs = screen.getAllByRole('spinbutton')
      fireEvent.change(allInputs[4], { target: { value: '30' } })
      fireEvent.change(allInputs[5], { target: { value: '10' } })

      const newCostInput = screen.getByPlaceholderText('Leave empty if adjusting price instead')
      fireEvent.change(newCostInput, { target: { value: '12' } })

      const unitsInput = screen.getByPlaceholderText('For monthly impact calculation')
      fireEvent.change(unitsInput, { target: { value: '100' } })

      // Monthly impact: -2 * 100 = -200
      expect(screen.getByText('Monthly Profit Impact')).toBeInTheDocument()
      expect(screen.getByText(/\$-200\.00/)).toBeInTheDocument()
    })

    it('shows suggested action text', () => {
      render(<PricingCalculator items={[]} />)

      const allInputs = screen.getAllByRole('spinbutton')
      fireEvent.change(allInputs[4], { target: { value: '30' } })
      fireEvent.change(allInputs[5], { target: { value: '10' } })

      const newCostInput = screen.getByPlaceholderText('Leave empty if adjusting price instead')
      fireEvent.change(newCostInput, { target: { value: '12' } })

      expect(screen.getByText('Suggested Action')).toBeInTheDocument()
      expect(screen.getByText(/Raise price/)).toBeInTheDocument()
    })

    it('handles both new cost and new price simultaneously', () => {
      render(<PricingCalculator items={[]} />)

      const allInputs = screen.getAllByRole('spinbutton')
      fireEvent.change(allInputs[4], { target: { value: '30' } })
      fireEvent.change(allInputs[5], { target: { value: '10' } })

      const newCostInput = screen.getByPlaceholderText('Leave empty if adjusting price instead')
      fireEvent.change(newCostInput, { target: { value: '12' } })

      const newPriceInput = screen.getByPlaceholderText('Leave empty if adjusting cost instead')
      fireEvent.change(newPriceInput, { target: { value: '35' } })

      // New margin: 35 - 12 = 23, old margin: 20, change: +3
      expect(screen.getByText(/\+\$3\.00/)).toBeInTheDocument()
    })

    it('shows current and new margin side by side', () => {
      render(<PricingCalculator items={[]} />)

      const allInputs = screen.getAllByRole('spinbutton')
      fireEvent.change(allInputs[4], { target: { value: '30' } })
      fireEvent.change(allInputs[5], { target: { value: '10' } })

      const newCostInput = screen.getByPlaceholderText('Leave empty if adjusting price instead')
      fireEvent.change(newCostInput, { target: { value: '12' } })

      expect(screen.getByText('Current Margin')).toBeInTheDocument()
      expect(screen.getByText('New Margin')).toBeInTheDocument()
      expect(screen.getByText('$20.00')).toBeInTheDocument()
      expect(screen.getByText('$18.00')).toBeInTheDocument()
    })
  })
})
