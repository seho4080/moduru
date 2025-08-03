import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addPin } from '../../../redux/slices/mapSlice';

const FakeAutoPin = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const interval = setInterval(() => {
      const id = `auto-${Date.now()}`;
      const lat = 37.5665 + Math.random() * 0.01;
      const lng = 126.978 + Math.random() * 0.01;

      dispatch(addPin({ id, lat, lng, userId: 'me' }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return null;
};

export default FakeAutoPin;