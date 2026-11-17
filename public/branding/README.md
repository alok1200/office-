Save the supplied original company logo PNG as `knooviq-logo.png` in this directory.

React's shared CompanyLogo component uses this image in all Employee, HR Admin and Super Admin sidebars, headers and footers, plus sign-in and loading views. After the image loads it is also used as the browser icon. Original image colors and aspect ratio are preserved.

The intended image is the user's globe/K logo with KNOOVIQ INDUSTRIES PVT LTD and the BUILDING SUCCESS INNOVATING FUTURES tagline. The pasted chat preview is not exposed as a local attachment file. The older company website logo and generic GitHub SVG are different and must not be substituted. Until the actual image file is available, a company-name fallback is displayed.

After adding the image, run `npm run build` from the project root and refresh the application. JPEG/WebP/SVG originals can also be used by preserving their file format and updating COMPANY_LOGO_PATH in src/components/Common/CompanyLogo.jsx.
