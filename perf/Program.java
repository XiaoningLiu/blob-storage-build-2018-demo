import java.net.MalformedURLException;
import java.net.URL;
import java.nio.ByteBuffer;
import java.security.InvalidKeyException;
import com.microsoft.azure.storage.blob.*;

import io.reactivex.Flowable;

public class Program {

    static void downloadBlob(BlockBlobURL blobURL) {
        try {
           Flowable<ByteBuffer> body = blobURL.download(new BlobRange(0, Long.MAX_VALUE), null, false).blockingGet().body();
           body.blockingLast();
        } catch (Exception ex){
            System.out.println(ex.getMessage());
        }
    }

    public static void main(String[] args){
        ContainerURL containerURL;

        try {
            
        	// Retrieve the credentials and initialize SharedKeyCredentials
            String accountName = args[0];
            String accountKey = args[1];

            System.out.println("Downloading with new Java SDK...");
            
            // Create a ServiceURL to call the Blob service. We will also use this to construct the ContainerURL
            SharedKeyCredentials creds = new SharedKeyCredentials(accountName, accountKey);
            final ServiceURL serviceURL = new ServiceURL(new URL("http://" + accountName + ".blob.core.windows.net"), StorageURL.createPipeline(creds, new PipelineOptions()));

            // Create a containerURL
            containerURL = serviceURL.createContainerURL("videos");

            // Create a BlockBlobURL to run operations on Blobs
            while(true){
            	
				long startTime = System.nanoTime();
            	
            	final BlockBlobURL blobURL = containerURL.createBlockBlobURL(args[2]);
            	downloadBlob(blobURL);
            	
            	long endTime   = System.nanoTime();
            	
				System.out.println("Time to download: " + (endTime - startTime));
            }

        } catch (InvalidKeyException e) {
            System.out.println("Invalid Storage account name/key provided");
        } catch (MalformedURLException e) {
            System.out.println("Invalid URI provided");
        }
    }
}
