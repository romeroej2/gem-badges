import { render } from '@testing-library/react';
import { GemBadge } from '../components/GemBadge';

describe('GemBadge component', () => {
  it('renders without crashing', () => {
    const { getByTestId } = render(<GemBadge gemColor="gold" />);
    expect(getByTestId('gem-badge')).toBeInTheDocument();
  });
});