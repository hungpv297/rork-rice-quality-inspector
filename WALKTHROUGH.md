# Rice Quality Inspector - Demo Walkthrough

## 1. App Launch

- Open the Rice Quality Inspector app on your device.
- The app loads the **Onboarding screen** with the title "Rice Quality Inspector" and subtitle "Rapid field-level rice quality assessment".
- A three-step progress indicator is visible at the top.

## 2. Sign Up

- **Step 1 - Create Your Profile**: Enter your Full Name, Username, and Organisation (optional). Tap **Continue**.
- **Step 2 - Select Your Role**: Choose a role from the list (e.g. "Rice Trader"). Tap **Continue**.
- **Step 3 - Disclaimer**: Read the disclaimer stating this tool is for indicative, field-level quality assessment only and does not replace laboratory analysis. Check "I understand and accept this disclaimer". Tap **Get Started**.
- The app navigates to the **Home screen**, which displays a greeting with your name, stats summary (Total Scans, Avg Broken, Premium count), and a "New Inspection" button. A disclaimer banner is shown: "Indicative field-level assessment only. Does not replace laboratory analysis."

## 3. Taking 2 Images and Selecting 1 Image

### Image 1 - Camera Capture

- Tap the **Capture** tab or the "New Inspection" card on the Home screen.
- The **Capture Sample** screen appears with photo guidelines (blue background, single layer, good lighting, steady camera).
- Select the **Rice Type** (e.g. "White/Polished Rice") from the dropdown.
- Tap **Take Photo** to open the camera. Capture a photo of the rice sample.
- The image preview appears with an "Analyse Quality" button.
- Tap **Analyse Quality**. The app shows "Processing image with AI model... This usually takes a few seconds".
- Once complete, the app navigates to the **Results** screen.

### Image 1 - Results

- The results screen displays the captured image at the top with the milling grade badge (e.g. "Premium" or "Grade 1").
- Date, time, and GPS coordinates (if available) are shown.
- A summary sentence describes the overall quality (e.g. "This sample shows good quality rice. The rice is classified as Grade 1 with 5.2% broken grains. Grains are slender shaped and predominantly long.").
- Quality badges show Grain Shape, Length Class, and Chalkiness status.
- Detailed sections include:
  - **Grain Counts**: Total, Broken, Long, Medium with percentages.
  - **Colour Composition**: Bar charts for Black, Chalky, Red, Yellow, Green grain percentages with threshold indicators.
  - **Kernel Shape**: Avg Length (mm), Avg Width (mm), L/W Ratio.
  - **CIELAB Colour Profile**: L* (Lightness), a* (Green-Red), b* (Blue-Yellow).
  - **Quality Summary**: Milling Grade, Grain Shape, Length Class, Chalkiness, and colour defect statuses with pass/warn/fail indicators.
- Footer shows Model version and Processing time.

### Image 2 - Gallery Selection

- Return to the **Capture** tab.
- Tap **Gallery** to select a rice sample image from the photo library.
- Choose an image. The preview loads.
- Select the **Rice Type** if different from the previous scan.
- Tap **Analyse Quality** and wait for processing.

### Image 2 - Results

- The results screen loads with the same comprehensive layout.
- Compare the milling grade, broken percentage, colour composition, and quality summary to the first image.
- Note any differences in grain counts, kernel shape, or defect alerts.

### Image 3 - Gallery Selection

- Return to the **Capture** tab once more.
- Tap **Gallery** and select a third rice sample image.
- Set the **Rice Type** as needed.
- Tap **Analyse Quality** and wait for the results.

### Image 3 - Results

- Review the full results for the third sample.
- The quality summary and classifications provide a complete assessment for this sample as well.

## 4. Scan History Screen

- Tap the **History** tab in the bottom navigation.
- The **Scan History** screen shows all completed scans in reverse chronological order.
- Each scan card displays the rice type, milling grade, broken percentage, and timestamp.
- Use the **filter chips** at the top (All, Premium, Grade 1, Grade 2, Grade 3, Below Grade) to filter scans by milling grade.
- Tap any scan card to view its full results.

## 5. Export / Share Results

### Export from Results Screen

- Open any scan result from the History screen.
- Tap the **download icon** (top-right) to export a CSV file for that single scan.
- Tap the **share icon** (top-right) to share the CSV file via the system share sheet (email, messaging apps, cloud storage, etc.).
- The CSV file includes all fields: ID, Date, Time, Rice Type, Milling Grade, Grain Shape, Length Class, all grain counts and percentages, kernel measurements, CIELAB values, quality statuses, model version, processing time, and GPS coordinates.

### Export All from History Screen

- On the **Scan History** screen, tap the **download icon** in the header.
- A CSV file containing all scan records is generated and the system share sheet opens.
- The file can be shared as an attachment via email, saved to cloud storage, or sent through any messaging app.

## 6. App Info and Model Version Screen

- Tap the **Profile** tab.
- Tap **About & Model Info** to open the About screen.
- The About screen displays:
  - App name: "Rice Quality Inspector"
  - App version: "Version 1.0.0"
  - **Model Information**: Model Version, Architecture (ConvNeXt Small, Tiled Multi-task), Input format (8x6 grid of 512x512 tiles), Source (UNIDO AfricaRice Quality Assessment Challenge, 3rd Place), Inference mode (On-device, offline capable).
  - **Data & Storage**: Total Scans count, Max History (100 scans), Storage (Local device only), Export (CSV via email/share).
  - **Credits**: Developed as part of the UNIDO AfricaRice initiative. IP co-owned by UNIDO and AfricaRice.
  - **Disclaimer**: Repeated notice about indicative assessment only.
- The Profile screen footer also shows the current model version.

## 7. Airplane Mode - Offline Testing

### Enable Airplane Mode

- Open device Settings and turn on **Airplane Mode** (disable Wi-Fi and mobile data).
- Return to the Rice Quality Inspector app.

### Image 1 (Offline) - Camera Capture

- Go to the **Capture** tab.
- Tap **Take Photo** and capture a rice sample image.
- Select the Rice Type.
- Tap **Analyse Quality**.
- The AI model runs **entirely on-device** using the bundled ONNX model, so inference completes successfully without internet.
- The results screen loads with full grain counts, kernel shape, colour composition, and quality classifications, confirming offline capability.

### Image 2 (Offline) - Gallery Selection

- Return to the **Capture** tab.
- Tap **Gallery** and select a rice sample image.
- Tap **Analyse Quality**.
- The analysis completes successfully offline.
- Full results are displayed, demonstrating that all AI inference and quality classification logic works without network connectivity.

### Image 3 (Offline) - Gallery Selection

- Return to the **Capture** tab.
- Tap **Gallery** and select another rice sample image.
- Tap **Analyse Quality** and confirm results are generated offline.

### Verify Offline History and Export

- Navigate to the **History** tab to confirm all offline scans are saved.
- Tap the **download icon** to export CSV. Note: sharing may be limited to local-only options (e.g. save to Files, AirDrop) since cloud-based sharing services require internet.

---

**Key Takeaway**: The Rice Quality Inspector app performs all AI inference on-device, enabling full functionality in areas with limited or no internet connectivity - critical for field-level rice quality assessment in rural regions.
