# Gym photo verification

Owner flow: My Gyms → Add gym → save profile → select a photo PDF → Send PDF for approval.
Owners can repeat this for each location. Each gym has an independent status and document history.

Admin flow: Gym Approvals → download the latest submitted PDF → inspect photos → approve or reject.
Rejection requires a reason. The owner receives an in-app notification and can correct the application and upload a new PDF.
Downloading enables the UI actions; the server independently validates admin role, latest submission, gym state and version.

## Storage and deployment

Uses the existing server-only AWS_REGION, AWS_BUCKET_NAME, AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.
AWS_GYM_DOCUMENT_BUCKET_NAME optionally directs documents to a separate private bucket in the same region.
Never place AWS credentials in VITE_ variables.

The backend writes to gym-verification/<gymId>/<random-id>.pdf with S3 server-side AES256 encryption and no public ACL.
The app downloads through an authenticated endpoint; no S3 keys or public URLs appear in gym APIs.
The server IAM identity needs s3:PutObject, s3:GetObject, and s3:DeleteObject for that prefix.
Keep the bucket private, or ensure any public gallery-image bucket policy excludes gym-verification/*.
A random key and an authenticated app route do not override a public bucket policy.
See [AWS S3 access policies](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-policy-language-overview.html).

The new migration adds only GymVerificationDocument and GymVerificationStatus.
Run npm install, npx prisma generate, and npx prisma migrate deploy in Server before starting the updated server.
The existing npm start already deploys migrations. Deploy Server before Client.

## Rules

- One PDF per upload, maximum 10 MB and 25 pages. Header, parseability and page count are checked; encrypted PDFs are rejected.
- PDF validation is not malware scanning or automatic proof of gym authenticity. The admin checks the photos.
- New revisions become pending review and supersede any earlier unreviewed revision.
- Previously reviewed documents and their decisions remain in submission history.
- Resubmitting an approved gym pauses its public listing and cancels upcoming trial bookings while review is pending.
- Approving a stale application or a superseded document returns 409 so the admin must refresh.
- Review updates, owner notification and admin audit record commit together.
- If storage succeeds but the database transaction fails, the newly uploaded object is removed.
- No email is sent; notifications appear in FitSwap.
