const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
  
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: Object.values(err.errors).map(error => error.message)
      });
    }
  
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
  
    res.status(500).json({ error: 'Internal Server Error' });
  };
  
  export default errorHandler;