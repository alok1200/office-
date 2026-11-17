Place the original company logo PNG at `knooviq-logo.png` in this directory.

The same unmodified image is used by React's CompanyLogo component in every portal sidebar, the sign-in page, loading view and brand footers. Once loaded, it is also used as the browser icon. The aspect ratio and original image colors are preserved.

The chat reference image was not available as a file in the workspace. Until the original is supplied, the component shows the company name as a text fallback. It does not substitute or redraw the official logo.

After adding the image, run `npm run build` from the project root and refresh the application.
