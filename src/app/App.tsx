/**
 * JOFLOW - Join the Flow of Kindness
 * An AI-powered geospatial relief ecosystem
 */

import { RouterProvider } from 'react-router';
import { router } from './routes';

export default function App() {
  return <RouterProvider router={router} />;
}
