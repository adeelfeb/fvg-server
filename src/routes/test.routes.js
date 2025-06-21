import { Router } from 'express';

// Route to set test cookies
app.get('/set-test-cookie', (req, res) => {
    // Set multiple test cookies with different attributes
    res.cookie('test_cookie_secure', 'secure_value', {
        secure: true,
        httpOnly: true,
        sameSite: 'None',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    
    res.cookie('test_cookie_regular', 'regular_value', {
        httpOnly: false, // Accessible via document.cookie
        sameSite: 'None',
        secure: true,
        maxAge: 24 * 60 * 60 * 1000
    });
    
    res.cookie('test_cookie_lax', 'lax_value', {
        secure: true,
        httpOnly: true,
        sameSite: 'Lax',
        maxAge: 24 * 60 * 60 * 1000
    });
    
    res.json(new ApiResponse(200, null, 'Test cookies set successfully'));
});

// Route to verify cookies
app.get('/verify-test-cookie', (req, res) => {
    const cookiesPresent = {
        test_cookie_secure: !!req.cookies.test_cookie_secure,
        test_cookie_regular: !!req.cookies.test_cookie_regular,
        test_cookie_lax: !!req.cookies.test_cookie_lax
    };
    
    const allCookiesWorking = Object.values(cookiesPresent).every(Boolean);
    
    res.json(new ApiResponse(
        allCookiesWorking ? 200 : 400,
        {
            cookiesPresent,
            receivedCookies: req.cookies,
            headers: req.headers
        },
        allCookiesWorking ? 'All cookies received successfully' : 'Some cookies are missing'
    ));
});

const router = Router();


export default router;