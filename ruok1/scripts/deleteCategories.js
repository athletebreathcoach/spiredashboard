const admin = require('firebase-admin');

// Initialize Firebase Admin with service account
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: 'ruok-8c88d',
    clientEmail: 'firebase-adminsdk-gbx5g@ruok-8c88d.iam.gserviceaccount.com',
    privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCdy97RHPqYdBiR\nT2Pwc9C3UslxvrzUPDwNBo6cUddx2wLrUUE7IB7QR8VjDDE9tTO1W7gsKKE7PIkQ\n7epFOOyWoYP/7KW8cp3ZJshq5FiOR0aUEK2yBeV9xj1CvO8JEnib87EVw3CbPHlS\n8RGNk25JSi80Z0r4AU7+PSlUrx56V0mJ5f+1YB0SwzAAg6NYVhWrnptWxSzXCK0c\nxPzrlnRsM0wjt5BNKeR84VMLkhVztnkz73zj49xEaBDivdul7kV6NPm3pi2wyasL\nMcyHx+KN6FC4PognP+QjzbB6UGFXz0Ztnctoy71hP6+u8tR3+b8EhQHzusuxTLLs\nRK7Nw+i3AgMBAAECggEABkM2F6SHyY8p/nJhLATcrrnpZstEIUQ2uemdtVSGMW2Y\nwxAZf6g5sNh4XAL63VEYuUTnnVELfRdc9UAMAS1OLnhAjeKtfTorS5f/ckaXwSXR\nBkVXL26OehxpCAIJlpmWEdJtH8j+6hpPUlxg7vZ/9Qatsu26ivc6VFrHDiZZFk/a\nhT2Pc0ZvFklW+CatIjI7NDx7ms+8kbwbgH4PsR7K6g3PcrLfseX4/BeRxE2Vxwrf\ndmKJQIIaUlQlFKf0Xm1FEVGRtNBrdVNRE1u2tHDOcuJjeB9KDNCRA3MpevTi0xtg\nQfeh5jG3Rr7idwkKcui3NrGNFPtDxHHuOAnsbtD+IQKBgQDcJlVk1lfzvSoF5WYl\nUG/qiZEURs9FwoCh6PkE8nWKAl3QWQ/bO4sqkOSqNRx05Nn2ktmMoNknGnsT2jPq\nNaSv39/3IlanYibuj38y/ENVn1nfNhhVsw73eHiTWAbThDf1q263owHiFz2b7WJe\nDX7TD1wl/XSFd+Pp8ssatzX1MQKBgQC3fiGdDX/PG3x/fUdLWu7KViZYk9CQBvsT\n5yrt6oOhmFEnGN7JK3CTuiFJekzfMTJJOQ1QH0dzq2fH53cLFvRNAbZydAfxnTMu\nyPshv4iYxexnONjq474t7C0pIURb7SlXH02zPG1KwfiCZGfdRgwVpiYG67WEjhVa\n12gDO+niZwKBgQDGB5V5B3ZGQjqy4w9nMVv61ZQzcR6x2axr+G1IDfG9GzPYXsTs\nqDsfJwcKNIxMei+2pZIb9fRgQGnGCdn5LBfgPLnyTGk2WAw9O8dnzZOkSZtGNhrd\nvBwSb8PGhsBdM+pCitslRPREtDMvN/HsOKeEo6R4Z+2Qwa+6mjQo6/UVgQKBgArI\n8xjUDksSBoNHzcT0F0z1O1PBfGS6xE8rKy7Itevtk/eEUrPoRbmpGwPCmHoV3irH\nm6y16fE2hecOB8UzGDDehOa9QypEXxnE3l3hcBnqqDZ49Ob5c9gnJZBhUC9HBUMF\np/988b+PHxgq5p/u2g77sQh/GjAsWbz5JDfscZbJAoGADuohvD0EACl16lfJGUIf\nYGy76/rVX2m9ZFBk6WGi6Gx6RcrMexXs21NkvLpNnqoH9R4/KCNkkMJL93lE5S0e\n/Hx37G2O41sbcVE06EPdwEzFTzeYeK6seq8FDwCHyzRkr2+Tvdeg2/Ye9asRfffe\nwroZqP0yQmRyBlzoueERS3s=\n-----END PRIVATE KEY-----\n'
  })
});

const db = admin.firestore();

async function deleteCategories() {
  try {
    const categoriesRef = db.collection('categories');
    const snapshot = await categoriesRef.get();
    
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log('Categories collection deleted successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error deleting categories:', error);
    process.exit(1);
  }
}

deleteCategories(); 